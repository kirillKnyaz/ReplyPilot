const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateICPSummary(profileData) {
  const prompt = `
  You're a B2B sales strategist building detailed Ideal Customer Profiles (ICP) to power search discovery, cold outreach, and follow-ups.

  Given the user's intake data, return a deeply specific, emotionally aware, and actionable ICP, following this structure:

  {
    "role": "job titles or day-to-day roles (not just Owner, e.g. 'manages client acquisition and referrals')",
    "companyType": "describe company size, industry, offer (e.g. 'local medspa with 1–3 employees selling cosmetic procedures')",
    "painPoints": ["emotional + business struggles, e.g. 'feels stuck relying on word of mouth'", "wants more recurring clients"],
    "buyingTriggers": ["life events or moments that push them to act", "e.g. 'hiring first employee', 'demand dropping off', 'launching new offer'"],
    "preferredChannels": ["actual places where they spend time (e.g. Instagram DMs, TikTok comments, WhatsApp)"],
    "coldMessageTips": ["phrasing, tone, or keywords that will resonate, e.g. 'mention ROI in the first line', 'be informal and fast-paced'"]
  }

  Return just the JSON. Think like a strategist who’s personally selling to this person.

  ---
  User's Intake Data:
  ${JSON.stringify(profileData, null, 2)}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content.trim();
  const jsonString = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(jsonString); // ✅ now it's a real JSON object
  } catch (err) {
    console.error('❌ Failed to parse GPT response as JSON:', raw);
    throw new Error('Invalid JSON returned by GPT');
  }
}

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

module.exports = { generateICPSummary, generateTextSearchQueryFromICP };