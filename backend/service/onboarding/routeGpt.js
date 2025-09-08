// service/onboarding/route.js
// One small GPT call that: (1) classifies the user msg,
// (2) extracts profile fields (matching DB column names),
// (3) names a topic if the user asked a question.
// Returns strict JSON per ../../schemas/routerSchema.js

const { OpenAI } = require("openai");
const { RouterOutputZ, RouterJsonSchema } = require("../../schemas/routerSchema");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * @typedef {{ role: 'user'|'assistant', text: string }} Turn
 * @typedef {Object} RouteArgs
 * @property {string} userMessage - raw user message (required)
 * @property {object} profile - current profile (UserProfile row or {})
 * @property {Turn[]} [history] - last few turns (use 4–6 for cost control)
 */

/**
 * @param {RouteArgs} args
 * @returns {Promise<import('../../schemas/routerSchema').RouterOutput>}
 */
async function routeAndExtract({ userMessage, profile, history = [] }) {
  const msg = (userMessage ?? "").toString().trim();
  if (!msg) {
    return {
      intent: "META_FLOW",
      confidence: 1.0,
      profile_delta: {},
      user_question_topic: null
    };
  }

  const trimmedTurns = history.slice(-6)
    .map(t => `${t.role === "user" ? "User" : "Assistant"}: ${String(t.text ?? "").trim()}`)
    .join("\n");

  console.log("[Router] history:", history, "trimmedTurns:", trimmedTurns);

  const SYSTEM = [
    "You are a routing + extraction module for a guided onboarding chat.",
    "Return STRICT JSON ONLY that matches the provided JSON schema.",
    "Intents: ANSWER_SLOT | ASK_QUESTION_IN_SCOPE | OFF_TOPIC | META_FLOW.",
    "If you classify as ANSWER_SLOT, extract ONLY these fields when explicitly present and unambiguous:",
    "If there are relevant fields extracted, format them in profile_delta; if you classify as ANSWER_SLOT, profile_delta must be non-empty.",
    "businessPurpose, businessOffer, businessAdvantage, businessGoals,",
    "audienceDefinition, audienceAge, audienceLocation, audienceProblem,",
    "offerMonetization, offerPricing, offerExclusivity, offerOptions.",
    "If the user asked a relevant question (offer/audience/monetization/pricing/outreach), set user_question_topic to a short noun phrase.",
    "If OFF_TOPIC, still extract any fields you can; user_question_topic must be null.",
    "If a field should be cleared, set it to null. Never invent values."
  ].join("\n");

  const USER_BLOCK = [
    "=== PROFILE (current) ===",
    JSON.stringify(profile || {}, null, 2),
    "\n=== RECENT TURNS (most recent last) ===",
    trimmedTurns || "(none)",
    "\n=== NEW USER MESSAGE ===",
    msg,
    "\n=== TASK ===",
    "Return STRICT JSON conforming to the JSON schema:",
    JSON.stringify({
      intent: "ANSWER_SLOT | ASK_QUESTION_IN_SCOPE | OFF_TOPIC | META_FLOW",
      confidence: "float 0–1",
      profile_delta: {
        businessPurpose: "string|null",
        businessOffer: "string|null",
        businessAdvantage: "string|null",
        businessGoals: "string|null",
        audienceDefinition: "string|null",
        audienceAge: "string|null",
        audienceLocation: "string|null",
        audienceProblem: "string|null",
        offerMonetization: "string|null",
        offerPricing: "string|null",
        offerExclusivity: "string|null",
        offerOptions: "string|null"
      },
      user_question_topic: "string|null"
    }, null, 2)
  ].join("\n");

  const resp = await openai.chat.completions.create({
    model: process.env.ROUTER_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: USER_BLOCK }
    ],
    response_format: {
      type: "json_object"
    }
  });

  const raw = resp.choices?.[0]?.message?.content ?? "{}";
  console.log("[Router] raw response:", raw);
  let parsed;
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }


  const safe = RouterOutputZ.safeParse(parsed);
  if (!safe.success) {
    console.error("[Router] Validation error:", safe.error.format());
    // Minimal safe fallback to keep the loop alive
    return {
      intent: "ANSWER_SLOT",
      confidence: 0.5,
      profile_delta: {},
      user_question_topic: null
    };
  }
  return /** @type {import('../../schemas/routerSchema').RouterOutput} */ (safe.data);
}

module.exports = { routeAndExtract };