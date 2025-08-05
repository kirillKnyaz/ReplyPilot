const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getNextSource } = require('../getNextSource.js');
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
  const {url, type} = await getNextSource(leadId);
  if (!url || !type) throw new Error(`No valid source found for lead ${leadId}`);

  // scrape the next source
  const htmlContent = await scrapePageText(url);

  // evaluate the scraped content with GPT
  const gptResult = await evaluateIdentityWithGPT(htmlContent, {
    name: lead.name,
    location: lead.location,
  });

  if (!gptResult || !gptResult.completed) {
    const updatedLead = await prisma.lead.update({
      where: { id: leadId, userId: userId },
      data: {
        website: url,
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
      website: url,
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

const scrapePageText = async (url) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const text = await page.evaluate(() => document.body.innerText);

  await browser.close();
  return text;
};

module.exports = { enrichIdentity };