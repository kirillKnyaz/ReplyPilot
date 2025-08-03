const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);

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

function isBlockedDomain(url) {
  const blocked = [
    'google.com',
    'support.google.com'
  ];
  return blocked.some(domain => url.includes(domain));
}

module.exports = { customSearchRequest };