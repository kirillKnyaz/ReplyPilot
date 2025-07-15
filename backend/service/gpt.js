const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateICPSummary(profileData) {
  const prompt = `
  You're a B2B outreach strategist. Based on this structured intake data, generate a clean JSON summary of the Ideal Customer Profile (ICP).

  Respond ONLY in this format (no extra commentary):
  {
    "role": "...",
    "companyType": "...",
    "painPoints": ["..."],
    "buyingTriggers": ["..."],
    "preferredChannels": ["..."],
    "coldMessageTips": ["..."]
  }

  Data:
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

module.exports = { generateICPSummary };