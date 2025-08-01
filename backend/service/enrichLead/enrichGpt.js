const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const evaluateIdentityWithGPT = async (rawText, leadInfo = {}) => {
  const prompt = `
  You're a lead enrichment AI. Your job is to analyze business data and determine whether there's enough information to understand what the business does. If the data is insufficient, you must say so. If it's enough, return a structured summary of the business.

  Respond in **strict JSON only**, using this format:

  {
    "completed": true or false,
    "type": "Business category or niche",
    "description": "One-liner explaining what the business does and for whom",
    "keywords": ["keyword1", "keyword2", ...],
    "reason": "Why this is or isn't sufficient"
  }

  -- Lead Info --
  Name: ${leadInfo.name || 'Unknown'}
  Location: ${leadInfo.location || 'Unknown'}

  -- Raw Text (from website or search result) --
  ${rawText.slice(0, 6000)}  // truncate to stay under GPT-4 context window
  `.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0].message.content.trim();

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (err) {
    throw new Error('❌ Failed to parse GPT response: ' + raw);
  }
};

module.exports = { evaluateIdentityWithGPT };