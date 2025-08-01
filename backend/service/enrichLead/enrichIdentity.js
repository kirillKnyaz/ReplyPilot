const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { customSearchRequest } = require('../customSearch.js');
const { evaluateIdentityWithGPT } = require('./enrichGpt');
const puppeteer = require('puppeteer');

const enrichIdentity = async ({
  userId,
  leadId
}) => {
  // load lead
  const lead = await prisma.lead.findUnique({
    where: { id: leadId, userId: userId },
  });

  if (!lead) {
    throw new Error(`Lead with ID ${leadId} not found for user ${userId}`);
  }

  // get next source to use
  const nextSource = await getNextSource(leadId);
  if (!nextSource) {
    throw new Error(`No valid source found for lead ${leadId}`);
  }

  // scrape the next source
  const htmlContent = await scrapePageText(nextSource);

  // evaluate the scraped content with GPT
  const gptResult = await evaluateIdentityWithGPT(htmlContent, {
    name: lead.name,
    location: lead.location,
  });

  if (!gptResult || !gptResult.completed) {
    const updatedLead = await prisma.lead.update({
      where: { id: leadId, userId: userId },
      data: {
        website: nextSource,
        identityComplete: gptResult.completed,
        description: gptResult.description,
        type: gptResult.type,
        keywords: gptResult.keywords,
      },
    });
    
    throw new Error(`Insufficient data to enrich identity: ${gptResult.reason}`, {
      data: updatedLead,
    });
  }

  // update lead with enriched data
  const updatedLead = await prisma.lead.update({
    where: { id: leadId, userId: userId },
    data: {
      website: nextSource,
      identityComplete: gptResult.completed,
      description: gptResult.description,
      type: gptResult.type,
      keywords: gptResult.keywords,
    },
    include: {
      sources: {
        where: { leadId: leadId, goal: 'IDENTITY' },
      },
    },
  });

  return updatedLead;
};

const getNextSource = async (leadId) => {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      sources: {
        where: { goal: 'IDENTITY' },
        select: { url: true },
      },
    },
  });

  const urls = new Set(lead.sources.map((source) => source.url));

  // check if there is a website available and hasn't been used first
  if (lead.website && !urls.has(lead.website)) {
    try {
      const createdSource = await prisma.leadSource.create({
        data: {
          leadId: lead.id,
          url: lead.website,
          goal: 'IDENTITY',
          type: 'WEBSITE',
        },
        select: { url: true },
      });

      return createdSource.url;
    } catch (error) {
      throw new Error(`Error creating source for lead ${leadId}: ${error.message}`);
    }
  }

  // fallback: search the web
  try {
    const query = `${lead.name} ${lead.location} website`;
    const webSearchItems = await customSearchRequest(query);

    for (const link of webSearchItems) {
      const isLikelyHomepage = /|about|home|contact|index/i.test(link) || link.length < 60;

      if (!urls.has(link) && isLikelyHomepage) {
        const createdSource = await prisma.leadSource.create({
          data: {
            leadId: lead.id,
            url: link,
            goal: 'IDENTITY',
            type: 'GCS_WEBSITE',
          },
          select: { url: true },
        });

        return createdSource.url;
      }
    }
  } catch (error) {
    throw error;
  }

  return null;
};

const scrapePageText = async (url) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const text = await page.evaluate(() => document.body.innerText);

  await browser.close();
  return text;
};

module.exports = { enrichIdentity };