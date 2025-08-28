const { OpenAI } = require('openai');
const ONBOARDING_STEPS = require('../lib/onboardingSteps');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateICPSummary(profileData) {
  const sys = `You convert onboarding answers into a compact ICP used for search and outreach.
  Return ONLY the function call with fields below. Keep user phrasing when appropriate.`;
  const fn = {
    name: "save_icp_summary",
    parameters: {
      type: "object",
      properties: {
        business_name: { type: "string" },
        service_types: { type: "array", items: { type: "string" } },
        ideal_clients: { type: "array", items: { type: "string" } },
        geo:           { type: "array", items: { type: "string" } },
        price_band:    { type: "object", properties: {
          min: { type: "number" }, max: { type: "number" }, currency: { type: "string" }
        }, required: ["min","max","currency"] },
        keywords:      { type: "array", items: { type: "string" } },
        disqualifiers: { type: "array", items: { type: "string" } },
        elevator_pitch:{ type: "string" }
      },
      required: ["service_types","ideal_clients","keywords","elevator_pitch"]
    }
  };

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(profileData) }
    ],
    tools: [{ type: "function", function: fn }],
    tool_choice: { type: "function", function: { name: "save_icp_summary" } }
  });

  const call = resp.choices[0].message.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("No ICP returned");
  return JSON.parse(call.function.arguments);
}

async function generateFlowSummary(flowEntry, completedSteps) {
  const completedStepsJson = JSON.stringify(completedSteps);
  const nextQuestion = ONBOARDING_STEPS.find(s => s.id === flowEntry.step)?.prompt || "N/A";

  const prompt = `
  You're a growth-focused sales strategist talking to the user, aiding him to complete the onboarding process.
  Based on this onboarding flow, shortly remind the user of his immediate progress. Follow up with the next question.
  Onboarding Flow:
  ${completedStepsJson}
  Next Question:
  ${nextQuestion}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
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

module.exports = { generateICPSummary, generateTextSearchQueryFromICP, generateFlowSummary };