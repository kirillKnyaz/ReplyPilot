// imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { customSearchRequest, getNextSource } = require('../getNextSource.js');
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
    ({ url, type } = await getNextSource(lead));
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
      tiktok: scrapedData.tiktok || lead.tiktok,
      // track if contact info is complete
      contactComplete: !!(
        scrapedData.phone || lead.phone 
        && scrapedData.email || lead.email 
        && scrapedData.facebook || lead.facebook 
        && scrapedData.instagram || lead.instagram 
        && scrapedData.tiktok || lead.tiktok
      )
    },
    include: { sources: true }
  });

  return updatedLead;
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

const scrapeSourceForContact = async (url, type, lead) => {
  let foundData = {
    phone: lead.phone ?? null,
    email: lead.email ?? null,
    facebook: lead.facebook ?? null,
    instagram: lead.instagram ?? null,
    tiktok: lead.tiktok ?? null
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