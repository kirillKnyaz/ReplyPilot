const customSearchKey = process.env.CUSTOM_SEARCH_API_KEY;
const searchEngineId = "53df65669469a4967";
const axios = require('axios');
const { response } = require('express');

const customSearchRequest = async (query, page = 1) => {
  const endpoint = `https://www.googleapis.com/customsearch/v1
  ?key=${customSearchKey}
  &q=${encodeURIComponent(query)}
  &start=${(page - 1) * 10 + 1}
  &cx=${searchEngineId}`;
  
  axios.get(endpoint).then((response) => {
    return response.data;
  }).catch((error) => {
    throw error;
  });
}

module.exports = {
  customSearchRequest
};