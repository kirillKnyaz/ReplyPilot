const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);
const stringSimilarity = require('string-similarity');

const customSearchRequest = async (query) => {
  return new Promise((resolve, reject) => {
    search.json(
      {
        q: query,
        hl: 'en',
        gl: 'ca', // prioritize Canadian results
        num: 10,
      },
      (data) => {
        if (!data || !data.organic_results || data.organic_results.length === 0) {
          return resolve([]);
        }

        const filtered = data.organic_results
          .map(r => r.link)
          .filter(url => url && !isBlockedDomain(url) && !url.endsWith('.pdf'));

        console.log(`Found ${filtered.length} valid URLs for query "${query}"`);

        resolve(filtered);
      }
    );
  });
};

const getNextSource = async (lead) => {
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

function isBlockedDomain(url) {
  const blocked = [
    'google.com',
    'support.google.com'
  ];
  return blocked.some(domain => url.includes(domain));
}

module.exports = { getNextSource };