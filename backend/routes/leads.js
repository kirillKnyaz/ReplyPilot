const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateTextSearchQueryFromICP } = require('../service/gpt');

router.get('/', async (req, res) => {
  const userId = req.user.userId;

  try {
    const leads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leads', error: err.message });
  }
});

router.post('/', async (req, res) => {
  const userId = req.user.userId;

  const { name, website, email, phone, notes } = req.body;
  if (!name || !website || !email) {
    return res.status(400).json({ message: 'Name, website, and email are required' });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        userId,
        name,
        website,
        email,
        phone,
        score: 0,
        notes
      }
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create lead', error: err.message });
  }
});

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
  
})

router.post('/:id/enrich/contact', async (req, res) => {
  
})

router.post('/:id/enrich/social', async (req, res) => {
  
})

module.exports = router;