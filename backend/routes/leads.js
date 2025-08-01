const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateTextSearchQueryFromICP } = require('../service/gpt');
const { enrichIdentity } = require('../service/enrichLead/enrichIdentity');

router.get('/', async (req, res) => {
  const userId = req.user.userId;

  try {
    const leads = await prisma.lead.findMany({
      where: { userId },
      include: {
        sources: true,
      }
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leads', error: err.message });
  }
});

router.post('/', async (req, res) => {
  const userId = req.user.userId;

  const { name, website, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({ message: 'Name and location are required' });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        userId,
        name,
        website: website || null,
        location,
      }
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create lead', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.userId;

  const leadId = req.params.id;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId, userId },
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    prisma.$transaction([
      prisma.leadSource.deleteMany({ where: { leadId } }),
      prisma.lead.delete({ where: { id: leadId, userId } }),
    ]).then(() => {
      res.status(204).send();
    }).catch((err) => {
      res.status(500).json({ message: 'Failed to delete lead', error: err.message });
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete lead', error: err.message });
  }
})

router.get('/generateQuery', async (req, res) => {
  const userId = req.user.userId;

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile?.icpSummary) {
    return res.status(400).json({ error: 'No ICP summary found' });
  }

  try {
    const query = await generateTextSearchQueryFromICP(profile.icpSummary);
    res.json({ query });
  } catch (err) {
    console.error('Error generating search query:', err);
    res.status(500).json({ error: 'Failed to generate search query' });
  }
})

router.post('/:id/enrich/identity', async (req, res) => {
  const userId = req.user.userId;
  const leadId = req.params.id;

  try{
    const updatedLead = await enrichIdentity({
      userId,
      leadId,
    });

    return res.json({ updatedLead });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to enrich identity', error: error.message });
  }
})

router.post('/:id/enrich/contact', async (req, res) => {
  const userId = req.user.userId;
  const leadId = req.params.id;

  try {
    const updatedLead = await enrichContact({
      userId,
      leadId,
    });

    return res.json({ updatedLead });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to enrich contact', error: error.message });
  }
})

router.post('/:id/enrich/social', async (req, res) => {
  const userId = req.user.userId;
  const leadId = req.params.id;

  try {
    const updatedLead = await enrichSocial({
      userId,
      leadId,
    });

    return res.json({ updatedLead });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to enrich social', error: error.message });
  }
})

module.exports = router;