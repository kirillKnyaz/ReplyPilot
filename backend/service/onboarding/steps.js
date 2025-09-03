const ONBOARDING_STEPS = [
  // understanding the business
  {
    category: "business",
    id: "businessPurpose",
    prompt: "What is the primary purpose of your business?"
  },
  {
    category: "business",
    id: "businessOffer",
    prompt: "What product or service are you offering?"
  },
  {
    category: "business",
    id: "businessAdvantage",
    prompt: "What is your unique advantage in the market?"
  },
  {
    category: "business",
    id: "businessGoals",
    prompt: "What are your main goals for the business?"
  },

  // understanding the audience
  {
    category: "audience",
    id: "audienceDefinition",
    prompt: "Who is your target audience?"
  },
  {
    category: "audience",
    id: "audienceAge",
    prompt: "What is the age range of your audience?"
  },
  {
    category: "audience",
    id: "audienceLocation",
    prompt: "Where is your audience located?"
  },
  {
    category: "audience",
    id: "audienceProblem",
    prompt: "What is the main problem your audience faces?"
  },

  // understanding the offer
  {
    category: "offer",
    id: "offerMonetization",
    prompt: "How do you plan to monetize your offer?"
  },
  {
    category: "offer",
    id: "offerPricing",
    prompt: "What is your pricing strategy?"
  },
  {
    category: "offer",
    id: "offerExclusivity",
    prompt: "Will your offer be exclusive to certain customers?"
  },
  {
    category: "offer",
    id: "offerOptions",
    prompt: "What options will you offer for your product or service?"
  }
];

module.exports = ONBOARDING_STEPS;