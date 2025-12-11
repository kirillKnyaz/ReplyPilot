// schemas/routerSchema.js
const { z } = require("zod");

/**
 * IMPORTANT:
 * - Keys MUST match Prisma columns exactly (column-only profile).
 * - Strings are trimmed downstream; use explicit `null` to clear a field.
 * - Keep this schema tiny to make the router cheap & reliable.
 */

// Profile delta limited to your 12 fields (plus future-proof icpSummary optional)
const ProfileDeltaZ = z.object({
  // understanding the business
  businessPurpose:    z.string().optional().nullable(),
  businessOffer:      z.string().optional().nullable(),
  businessAdvantage:  z.string().optional().nullable(),
  businessGoals:      z.string().optional().nullable(),

  // understanding the audience
  audienceDefinition: z.string().optional().nullable(),
  audienceAge:        z.string().optional().nullable(),      // keep string (e.g., "25–45", "18+")
  audienceLocation:   z.string().optional().nullable(),
  audienceProblem:    z.string().optional().nullable(),

  // understanding the offer
  offerMonetization:  z.string().optional().nullable(),      // e.g., "subscription", "one-time"
  offerPricing:       z.string().optional().nullable(),
  offerExclusivity:   z.string().optional().nullable(),
  offerOptions:       z.string().optional().nullable(),

  // we do NOT let the model set *Complete flags directly
  // icpSummary is produced by summarizer; router shouldn't fill it
}).strict();

// Router output: intent + confidence + delta + (optional) topic for Q&A turns
const RouterOutputZ = z.object({
  intent: z.enum(["ANSWER_SLOT", "ASK_QUESTION_IN_SCOPE", "OFF_TOPIC", "META_FLOW"]),
  confidence: z.number().min(0).max(1),
  profile_delta: ProfileDeltaZ,
  user_question_topic: z.string().min(1).nullable().default(null)
}).strict();

module.exports = {
  ProfileDeltaZ,
  RouterOutputZ,
  /** @typedef {import("zod").infer<typeof RouterOutputZ>} RouterOutput */
};