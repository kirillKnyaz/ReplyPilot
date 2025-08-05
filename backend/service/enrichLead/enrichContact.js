// imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { customSearchRequest } = require('../customSearch.js');
const puppeteer = require('puppeteer');
const stringSimilarity = require('string-similarity');

// main worflow
const enrichContact = async (leadId) => {
  // get lead details in the first place
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { sources: true }
  });

  let { url, type } = {};
  try {
    // get the next source to enrich
    ({ url, type } = await getNextContactSource(lead));
    // if no source is available (equal to null), return null
    if (!url || url === null) throw new Error('No contact sources available for enrichment.');
    // if there is a source, save it now
    const createdSource = await prisma.leadSource.create({
      data:{
        leadId: lead.id,
        type: type,
        url: url,
        goal: 'CONTACT'
      }
    })
  } catch (error) {
    throw new Error(`Failed to get next contact source: ${error.message}`);
  }

  // scrape to get data
  let scrapedData = scrapeSourceForContact(url, type);
  
  // save the data to the lead
  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      phone: scrapedData.phone || lead.phone,
      email: scrapedData.email || lead.email,
      facebook: scrapedData.facebook || lead.facebook,
      instagram: scrapedData.instagram || lead.instagram,
      tiktok: scrapedData.tiktok || lead.tiktok
    }
  });

  return updatedLead;
}

const getNextContactSource = async (lead) => {
  // check if contacts are already enriched
  const foundFlags = {
    website: lead.website ? true : false,
    email: lead.email ? true : false,
    phone: lead.phone ? true : false,
    instagram: lead.instagram ? true : false,
    facebook: lead.facebook ? true : false,
    tiktok: lead.tiktok ? true : false,
  }

  // if all sources are enriched, return null
  if (Object.values(foundFlags).every(flag => flag)) return { url: null, type: null };

  // step by step, start checking the sources
  // first, the lead's website
  if (lead.website !== null && lead.website !== '') return { url: lead.website, type: 'WEBSITE' };

  // if website is not provided straight away, check all the sources 
  if (lead.sources.length > 0) {
    for (const source of lead.sources) {
      if (source.type === 'WEBSITE' || source.type === 'GCS_WEBSITE') return { url: source.url, type: source.type };
      if (source.type === 'SOCIAL') return {url: source.url, type: source.type};
    }
  }

  // if website not provided from places, search manually
  const searchQuery = `${lead.name} ${lead.location} contact`;
  const searchResults = await customSearchRequest(searchQuery);
  if (searchResults.length === 0 || searchResults === null) throw new Error('No search results');

  for (const result of searchResults) {
    const url = result.url;
    // check if the URL is a valid website
    if (url && url.startsWith('https') && !isBlockedDomain(url)) {
      // inside search results, look for the first website that matches the lead's name
      // check string similarity to the lead name
      const { hostname } = new URL(url);
      const leadName = lead.name.toLowerCase();
      const similarity = stringSimilarity.compareTwoStrings(leadName, hostname);
      console.log(`Checking URL: ${url}, similarity: ${similarity} for lead: ${leadName}`);
      if (similarity > 0.6) {
        return { url: url, type: 'GCS_WEBSITE' };
      }
      
      // if no website was found, look for facebook, then instagram, then tiktok
      switch (url) {
        case url.includes('facebook.com'):
          if (!foundFlags.facebook) return { url: url, type: 'SOCIAL' };
          break;
        case url.includes('instagram.com'):
          if (!foundFlags.instagram) return { url: url, type: 'SOCIAL' };
          break;
        case url.includes('tiktok.com'):
          if (!foundFlags.tiktok) return { url: url, type: 'SOCIAL' };
          break;
        default:
          // if no social media was found, return null
          return { url: null, type: null };
      }
    }
  }

  // if nothing comes up, return null, no more sources to check
  return { url: null, type: null };
}

const tryClosePopups = async (page) => {
  const selectors = [
    '[aria-label="Close"][role="button"]',
    '[aria-label="Dismiss"][role="button"]',
    '[aria-label="Close"]',
    '[aria-label="Dismiss"]',
    'svg[aria-label="Close"]'
  ];

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      await page.click(selector);
      console.log(`Popup closed with: ${selector}`);
      break;
    } catch (_) {
      continue;
    }
  }
};

const scrapeSourceForContact = async (url, type) => {
  let foundData = {
    phone: null,
    email: null,
    facebook: null,
    instagram: null,
    tiktok: null
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  await tryClosePopups(page);

  // Extract all anchor hrefs
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map(a => a.href);
  });

  // Process links
  for (const link of links) {
    const l = link.toLowerCase();

    if (!foundData.email && l.startsWith('mailto:')) {
      foundData.email = l.replace('mailto:', '');
    }

    if (!foundData.phone && l.startsWith('tel:')) {
      foundData.phone = l.replace('tel:', '');
    }

    if (!foundData.facebook && l.includes('facebook.com')) {
      foundData.facebook = link;
    }

    if (!foundData.instagram && l.includes('instagram.com')) {
      foundData.instagram = link;
    }

    if (!foundData.tiktok && l.includes('tiktok.com')) {
      foundData.tiktok = link;
    }

    // Exit early if all data is found
    if (Object.values(foundData).every(Boolean)) break;
  }

  await browser.close();
  return foundData;
};

module.exports = {
  enrichContact
};