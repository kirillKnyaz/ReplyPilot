const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateTextSearchQueryFromICP(idealCustomerProfile) {
  const prompt = `
  You're a growth-focused sales strategist. Based on this ICP, generate 1 text search queries I can use in Google Places or Google Search to find highly relevant businesses. Use natural search phrasing, keywords, and examples from the ICP.

  ICP:
  ${JSON.stringify(idealCustomerProfile, null, 2)}

  Respond with only the query, no extra explanation.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
}

module.exports = {  generateTextSearchQueryFromICP };