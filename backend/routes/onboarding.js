const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ONBOARDING_STEPS = require('../lib/onboardingSteps.js');
const z = require('zod');
const { generateICPSummary, generateFlowSummary } = require('../service/gpt.js');
const { OpenAI } = require('openai');
const authenticate = require('../middleware/authenticate.js');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const answerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string(),
  answer: z.any()
})

router.post('/start', async (req, res) => {
  console.log("Onboarding start requested by user", req.user.userId);
  const userId = req.user.userId;
  
  // check if exists or complete  
  const completedFlows = await prisma.onboardingFlow.findMany({
    where: { userId },
    orderBy: { step: "desc" }
  })

  const lastFlow = completedFlows[0];
  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.id === lastFlow.step);
  const nextStep = ONBOARDING_STEPS[currentStepIndex + 1];
  
  if (lastFlow && ONBOARDING_STEPS.some(step => step.id === lastFlow.step)) {
    // that's the last completed step
    console.log('Resuming existing onboarding flow for user:', userId);
    if (lastFlow.answer === null || lastFlow.answer === undefined) {
      // the question wasn't completed
      const AIReply = await generateFlowSummary(lastFlow, completedFlows);

      return res.json({
        sessionId: userId,
        stepIndex: ONBOARDING_STEPS.findIndex(s => s.id === lastFlow.step),
        question: { id: lastFlow.step, prompt: AIReply, type: findType(lastFlow.step) }
      });
    }

    // if completed the last step, return the next one
    if (currentStepIndex === -1) {
      return res.status(500).json({ error: 'Inconsistent onboarding state' });
    }
    
    // if last step, return complete
    if (currentStepIndex === ONBOARDING_STEPS.length - 1) {
      return res.json({ message: 'Onboarding complete', onBoardingComplete: true });
    }

    await prisma.onboardingFlow.create({
      data: { step: nextStep.id, question: nextStep.prompt, answer: null, user: { connect: { id: userId } } }
    });
    
    return res.json({
      sessionId: userId,
      stepIndex: currentStepIndex + 1,
      question: { id: nextStep.id, prompt: nextStep.prompt, type: nextStep.type, options: nextStep.options || [] }
    });
  }

  // if not started, start a new session
  await prisma.onboardingFlow.create({
    data: { step: ONBOARDING_STEPS[0].id, question: ONBOARDING_STEPS[0].prompt, answer: null, user: { connect: { id: userId } } }
  })

  return res.json({
    sessionId: userId,
    stepIndex: 0,
    question: { id: nextStep.id, prompt: nextStep.prompt, type: nextStep.type }
  });
});

router.post("/answer", async (req, res) => {
  const userId = req.user.userId;
  const { sessionId, questionId, answer } = answerSchema.parse(req.body);
  console.log("Onboarding answer received from user", userId, "for question", questionId, "with answer", answer);
  if (sessionId !== userId) return res.status(400).json({ error: "bad session" });

  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.id === questionId);
  if (currentStepIndex === -1) {
    return res.status(400).json({ error: 'Invalid questionId' });
  }

  // ensure we set the answer for the most recent unanswered row of this step
  await prisma.onboardingFlow.updateMany({
    where: { userId, step: questionId, answer: null },
    data: { answer: normalizeAnswer(answer) } // stringify arrays/objects; keep numbers as numbers if using Json
  });

  // if last step, return complete
  if (currentStepIndex === ONBOARDING_STEPS.length - 1) {
    return res.json({ message: 'Onboarding complete', onBoardingComplete: true });
  }

  // create the next step
  const nextStep = ONBOARDING_STEPS[currentStepIndex + 1];
  console.log("Creating next onboarding step for user", userId, "step", nextStep.id);
  await prisma.onboardingFlow.create({
    data: { step: nextStep.id, question: nextStep.prompt, answer: null, user: { connect: { id: userId } } }
  });

  return res.json({
    sessionId: userId,
    stepIndex: currentStepIndex + 1,
    question: { id: nextStep.id, prompt: nextStep.prompt, type: nextStep.type }
  }); 
});

router.post('/back', async (req, res) => {
  const userId = req.user.userId;
  const last = await prisma.onboardingFlow.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  if (!last) return res.json({ message: "nothing to undo" });

  await prisma.onboardingFlow.delete({
    where: { id: last.id }
  })

  const previous = await prisma.onboardingFlow.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!previous) {
    // start over
    const firstStep = ONBOARDING_STEPS[0];
    const newFlow = await prisma.onboardingFlow.create({
      data: {
        step: firstStep.id,
        question: firstStep.prompt,
        answer: null,
        user: { connect: { id: userId } }
      }
    });
    return res.json(newFlow);
  }

  return res.json(previous);
})

router.post('/complete', async (req, res) => {
  const userId = req.user.userId;
  const flow = await prisma.onboardingFlow.findMany({ where: { userId }, orderBy: { step: "asc" }});

  if (flow.length === 0) {
    return res.status(400).json({ error: 'No onboarding data found' });
  }

  const raw = {};
  for (const s of ONBOARDING_STEPS) {
    const row = flow.find(f => f.step === s.id);
    raw[s.id] = row ? parseMaybeJson(row.answer) : null;
  }

  // Derive structured scalars
  const structured = {
    goal: raw.success ?? null,
    successKpi: "Booked calls per month",
    urgency: clampInt(raw.urgency, 0, 100),
    confidence: clampInt(raw.confidence, 0, 100),
    hoursPerWeek: clampInt(raw.hours, 0, 168),
    riskTolerance: raw.risk ?? null,
    tonePreference: raw.tone ?? null,
    obstacles: Array.isArray(raw.obstacles) ? raw.obstacles : [],
  };

  // Summarize with LLM (function-calling)
  const icpSummary = await generateICPSummary(raw);

  await prisma.userProfile.upsert({
    where: { userId },
    update: { profileData: raw, icpSummary, ...structured },
    create: { userId, profileData: raw, icpSummary, ...structured }
  });

  return res.json({ profile: structured, icpSummary });
})

router.get('/flow', async (req, res) => {
  const userId = req.user.userId;
  const rows = await prisma.onboardingFlow.findMany({ where: { userId }, orderBy: { createdAt: "asc" }});
  return res.json(rows);
});

module.exports = router;

function parseMaybeJson(s) { 
  try { 
    return JSON.parse(s); 
  } catch { 
    return s; 
  } 
}

function clampInt(n, min, max) { 
  n = Number(n);
  if (Number.isNaN(n)) return null; 
  return Math.max(min, Math.min(max, n)); 
}

function findType(stepId){
  const s = ONBOARDING_STEPS.find(x => x.id === stepId);
  return s?.type ?? "text";
}

function normalizeAnswer(a){
  if (a == null) return null;
  return JSON.stringify(a);
}