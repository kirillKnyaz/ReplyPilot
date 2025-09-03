// service/onboarding/slotPicker.js
// Centralized "what's next?" logic + helpers for flags/progress.

const ONBOARDING_STEPS = require("./steps");

/** Category → field keys mapping (must match your Prisma columns) */
const CATEGORIES = {
  business: ["businessPurpose", "businessOffer", "businessAdvantage", "businessGoals"],
  audience: ["audienceDefinition", "audienceAge", "audienceLocation", "audienceProblem"],
  offer:    ["offerMonetization", "offerPricing", "offerExclusivity", "offerOptions"],
};

/** Default order you want to complete things in */
const CATEGORY_ORDER = ["business", "audience", "offer"];

/**
 * Return the next slot (field) to ask for, as a "question object"
 * { id, prompt, category, type }
 * Returns null if all required fields are filled.
 */
function pickNextSlot(profile, categoryOrder = CATEGORY_ORDER) {
  for (const cat of categoryOrder) {
    const keys = CATEGORIES[cat];
    for (const id of keys) {
      if (!isFilled(profile?.[id])) {
        return keyToQuestion(id, cat);
      }
    }
  }
  return null;
}

/** Convert a field id to a question object, using ONBOARDING_STEPS when available */
function keyToQuestion(id, fallbackCategory) {
  const step = ONBOARDING_STEPS.find(s => s.id === id);
  if (step) {
    return {
      id: step.id,
      prompt: step.prompt,
      category: step.category,
      type: step.type ?? "text",
    };
  }
  // Safe fallback if the step isn't in the list
  return {
    id,
    prompt: toHumanPrompt(id),
    category: fallbackCategory || inferCategoryFromKey(id),
    type: "text",
  };
}

/** Compute boolean completion flags from the current profile */
function computeCompletionFlags(profile) {
  return {
    businessComplete: allFilled(profile, CATEGORIES.business),
    audienceComplete: allFilled(profile, CATEGORIES.audience),
    offerComplete:    allFilled(profile, CATEGORIES.offer),
  };
}

/** Progress counter across all fields (for UI meter) */
function progress(profile) {
  const allKeys = [...CATEGORIES.business, ...CATEGORIES.audience, ...CATEGORIES.offer];
  const known = allKeys.filter(k => isFilled(profile?.[k])).length;
  return { requiredKnown: known, requiredTotal: allKeys.length };
}

/** Utility: is a field considered filled? */
function isFilled(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

/** Utility: are *all* keys filled? */
function allFilled(profile, keys) {
  return keys.every(k => isFilled(profile?.[k]));
}

/** Fallback prompt generator if a step isn’t present in ONBOARDING_STEPS */
function toHumanPrompt(id) {
  // Convert camelCase → human-friendly label
  const label = id.replace(/([A-Z])/g, " $1").toLowerCase(); // businessPurpose → business purpose
  return `Please provide your ${label}.`;
}

/** If needed, infer category from field name */
function inferCategoryFromKey(id) {
  if (id.startsWith("business")) return "business";
  if (id.startsWith("audience")) return "audience";
  if (id.startsWith("offer"))    return "offer";
  return "business";
}

module.exports = {
  pickNextSlot,
  computeCompletionFlags,
  progress,
  isFilled,

  // export maps if other services need them
  CATEGORIES,
  CATEGORY_ORDER,
  keyToQuestion,
};
