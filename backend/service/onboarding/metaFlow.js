// service/onboarding/metaFlow.js
const { pickNextSlot } = require("./slotPicker");

// Deterministic handlers for META_FLOW intents
async function handleMetaFlow({ message, profile }) {
  const msg = (message || "").toLowerCase().trim();
  const nextSlot = pickNextSlot(profile);

  // Back / Undo
  if (/(^|\b)(back|undo|previous)\b/.test(msg)) {
    return {
      reply: nextSlot
        ? `Okay, let’s revisit. ${nextSlot.prompt}`
        : "We’re already at the beginning. Tell me what you’d like to update.",
      asked_slot: nextSlot || null
    };
  }

  // Restart / Reset
  if (/(restart|reset|start over)/.test(msg)) {
    return {
      reply: "Restarting onboarding. Let’s begin again. What is the primary purpose of your business?",
      asked_slot: { id: "businessPurpose", prompt: "What is the primary purpose of your business?", category: "business", type: "text" }
    };
  }

  // Summarize / Recap
  if (/summari[sz]e|recap|overview/.test(msg)) {
    const summary = summarizeProfile(profile);
    return {
      reply: summary,
      asked_slot: nextSlot || null
    };
  }

  // What’s next?
  if (/what'?s next|next step|continue/.test(msg)) {
    return {
      reply: nextSlot
        ? nextSlot.prompt
        : "You’ve filled in all the essentials. Ask me about pricing, outreach, or scripts.",
      asked_slot: nextSlot || null
    };
  }

  // Default fallback
  return {
    reply: nextSlot
      ? `Let’s keep going. ${nextSlot.prompt}`
      : "All essentials are captured. You can ask me a question (pricing, channels, scripts) or request a summary.",
    asked_slot: nextSlot || null
  };
}

function summarizeProfile(profile) {
  const lines = [];
  if (profile.businessPurpose) lines.push(`• Purpose: ${profile.businessPurpose}`);
  if (profile.businessOffer) lines.push(`• Offer: ${profile.businessOffer}`);
  if (profile.businessAdvantage) lines.push(`• Advantage: ${profile.businessAdvantage}`);
  if (profile.businessGoals) lines.push(`• Goals: ${profile.businessGoals}`);
  if (profile.audienceDefinition) lines.push(`• Audience: ${profile.audienceDefinition}`);
  if (profile.audienceProblem) lines.push(`• Pain: ${profile.audienceProblem}`);
  if (profile.offerMonetization) lines.push(`• Monetization: ${profile.offerMonetization}`);
  if (profile.offerPricing) lines.push(`• Pricing: ${profile.offerPricing}`);
  return lines.length
    ? `Here’s what I’ve got so far:\n${lines.join("\n")}`
    : "We haven’t captured much yet. Let’s start with your business purpose.";
}

module.exports = { handleMetaFlow };