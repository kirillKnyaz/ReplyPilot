// imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { customSearchRequest } = require('../customSearch.js');
const puppeteer = require('puppeteer');

// main worflow
const enrichContact = async (leadId) => {
  // get lead details in the first place
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { sources: true }
  });
  // get the next source to enrich
  // if no source is available (equal to null), return null
  // scrape to get data
  // save the data to the lead
  // if no data was found or the data was not enough, look again
  // if enough data was found or all sources were exhausted, return the data
}

const getNextContactSource = async (lead) => {
  // check if contacts are already enriched
  const notFoundFlags = {
    website: lead.website ? false : true,
    email: lead.email ? false : true,
    phone: lead.phone ? false : true,
    instagram: lead.instagram ? false : true,
    facebook: lead.facebook ? false : true,
    tiktok: lead.tiktok ? false : true,
  }

  // if all sources are enriched, return null
  if (Object.values(notFoundFlags).every(flag => flag)) {
    throw new Error('All contact sources for this lead are already enriched. No further action is required.');
  }

  // step by step, start checking the sources
  // first, the lead's website
  if (lead.website !== null && lead.website !== '') return lead.website;

  // if website is not provided straight away, check all the sources 
  if (lead.sources.length > 0) {
    lead.sources.map(source => {
      if (source.type === 'WEBSITE' || source.type === 'GCS_WEBSITE') return source.url;
      if (source.type === 'SOCIAL') return source.url;
    });
  }

  // if website not provided from places, search manually
  const searchQuery = `${lead.name} ${lead.location} contact`;
  const searchResults = await customSearchRequest(searchQuery);
  if (searchResults.length === 0 || searchResults === null) throw new Error('No search results');

  // inside search results, look for the first website that matches the lead's name
  // if no website was found, look for facebook, then instagram, then tiktok

  // if nothing comes up, return null, no more sources to check
}

module.exports = {
  enrichContact
};