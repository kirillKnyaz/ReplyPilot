const ONBOARDING_STEPS = [
  { id: "intro", prompt: `
    Welcome! I am OnboardPilot, your AI assistant to help you get started with ReplyPilot. 
    I'll ask you some questions to set up your profile and preferences. Ready?
  `, type: "confirm", required: true },
  { id: "service", prompt: "What do you sell and for whom?", type: "text", required: true },
  { id: "success", prompt: "What would success in the next 30 days look like?", type: "text", required: true },
  { id: "urgency", prompt: "How urgent is this? (0–100)", type: "number", min: 0, max: 100, required: true },
  { id: "confidence", prompt: "How confident are you RP can help? (0–100)", type: "number", min: 0, max: 100, required: true },
  { id: "hours", prompt: "How many hours/week can you invest?", type: "number", min: 0, max: 168, required: true },
  { id: "risk", prompt: "How aggressive should we be with cold outreach?", type: "select",
    options: ["LOW","MEDIUM","HIGH"], required: true },
  { id: "tone", prompt: "What tone should we use in messages?", type: "select",
    options: ["CASUAL","PROFESSIONAL","BOLD","CAREFUL"], required: true },
  { id: "obstacles", prompt: "What’s most in your way right now? (multi-select + text)", type: "multiselect",
    options: ["time","copy","niche","deliverability","budget"], required: false },
];

module.exports = ONBOARDING_STEPS;