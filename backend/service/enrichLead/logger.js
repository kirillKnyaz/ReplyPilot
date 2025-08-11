const prisma = require('../../lib/prisma.js');

// log the start of an enrichment step
async function startEnrichmentStep({ userId, leadId, goal, step, message = null }) {
  const attempt = await getAttemptCount({ userId, leadId, goal, step });
  const log = await prisma.leadEnrichmentLog.create({
    data: {
      userId,
      leadId,
      goal,
      step,
      attempt,
      status: 'STARTED',
      message,
    },
  });
  return log.id; // keep the ID to update status later
}

// update the status of an enrichment step
async function updateEnrichmentStep(logId, status, message = null) {
  await prisma.leadEnrichmentLog.update({
    where: { id: logId },
    data: {
      status,
      message,
    },
  });
}

const getAttemptCount = async ({ userId, leadId, goal, step }) => {
  const count = await prisma.leadEnrichmentLog.count({
    where: {
      userId,
      leadId,
      goal,
      step,
    },
  });
  return count + 1; // next attempt number
};

async function getLatestLog({ userId, leadId, goal }) {
  return await prisma.leadEnrichmentLog.findFirst({
    where: { userId, leadId, goal },
    orderBy: { createdAt: 'desc' }
  })
}

module.exports = {
  startEnrichmentStep,
  updateEnrichmentStep,
  getLatestLog
};
