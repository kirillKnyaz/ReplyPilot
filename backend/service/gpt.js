const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateICPSummary(profileData) {
  const prompt = `
  You're a B2B outreach strategist. Your job is to craft the perfect Ideal Customer Profile (ICP) for a sales campaign based on structured onboarding data.

  Here is the user’s data:
  ${JSON.stringify(profileData, null, 2)}

  Generate a concise but detailed ICP. Include:
  - Customer role and company type
  - Key problems they face
  - What they care about and why they buy
  - Where they hang out (channels, platforms)
  - How to best approach them with a cold message

  Respond in professional tone, using 3–6 bullet points.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateICPSummary };
