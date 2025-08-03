// imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { customSearchRequest } = require('../customSearch.js');
const puppeteer = require('puppeteer');


// main function to enrich contact
const enrichContact = async ({ userId, leadId }) => {
  console.log(`Enriching contact for lead ${leadId} for user ${userId}`);
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
  //return updatedLead;
};

// function to get the next source for enrichment
const getNextSource = async (leadId) => {
  console.log(`Getting next source for lead ${leadId}`);
  // fetch the lead and its sources
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { 
      sources: {
        where: { goal: 'CONTACT' }
      } 
    },
  });

  const urls = new Set(lead.sources.map(source => source.url));

  // look if a website has been used for contact enrichment
  if (lead.website && !urls.has(lead.website)) {
    console.log(`Using lead's website for contact enrichment: ${lead.website}`);
    return lead.website;
  }

  // if the lead has no website and it hasnt been provided, look on the web
  if (!lead.website) {
    return null; // no website to scrape for now : TODO : Implement web search
    console.log(`Lead has no website, searching for contact info online...`);
    const query = `${lead.name} ${lead.location} contact`;
    const searchResults = await customSearchRequest(query);
    if (searchResults && searchResults.length > 0) {
      console.log(`Found ${searchResults.length} potential contact URLs.`);
      return searchResults[0]; // return the first result for now
    }
  }
}

const scrapeWebsiteForContact = async (url) => {
  console.log(`Scraping website for contact info: ${url}`);
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const htmlDOM = await page.content();
  
}

module.exports = {
  enrichContact
};