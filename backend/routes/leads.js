const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

// const prisma = require('../lib/prisma.js');
const { generateTextSearchQueryFromICP } = require('../service/gpt');
const { enrichIdentity } = require('../service/enrichLead/identity');
const { enrichContact } = require('../service/enrichLead/contact');

// routes/leads.js
router.patch('/:id', async (req, res) => {
  const userId = req.user.userId;
  const leadId = req.params.id;

  // Only allow updating these fields manually
  const allowed = [
    'name', 'type', 'description', 'keywords',
    'website', 'email', 'phone',
    'instagram', 'facebook', 'tiktok',
    'location', // optional if you want it editable
  ];

  try {
    const existing = await prisma.lead.findFirst({
      where: { id: leadId, userId },
    });
    if (!existing) return res.status(404).json({ message: 'Lead not found' });

    // Build update payload from allowed fields
    const data = {};
    for (const k of allowed) {
      if (k in req.body) data[k] = req.body[k];
    }

    // Normalize keywords (string -> array)
    if ('keywords' in data && typeof data.keywords === 'string') {
      data.keywords = data.keywords
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    // Merge to compute flags from the final state
    const merged = { ...existing, ...data };

    const identityComplete = Boolean(
      (merged.type && merged.type.trim()) ||
      (merged.description && merged.description.trim()) ||
      (Array.isArray(merged.keywords) && merged.keywords.length > 0)
    );

    const contactComplete = Boolean(
      (merged.website && merged.website.trim()) ||
      (merged.email && merged.email.trim()) ||
      (merged.phone && merged.phone.trim())
    );

    const socialComplete = Boolean(
      (merged.instagram && merged.instagram.trim()) ||
      (merged.facebook && merged.facebook.trim()) ||
      (merged.tiktok && merged.tiktok.trim())
    );

    data.identityComplete = identityComplete;
    data.contactComplete  = contactComplete;
    data.socialComplete   = socialComplete;

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data,
      include: { sources: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update lead', error: err.message });
  }
});

router.get('/', async (req, res) => {
  const userId = req.user.userId;

  try {
    const leads = await prisma.lead.findMany({
      where: { userId },
      include: {
        sources: true,
        lists: { select: {
          id: true,
          list: { select: { id: true, name: true} }
        } }
      }
    });

    const shaped = leads.map(l => ({
      ...l,
      lists: l.lists.map(x => x.list) // [{id, name}]
    }));

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leads', error: err.message });
  }
});

router.post('/', async (req, res) => {
  const userId = req.user.userId;

  const { name, website, location, additionalData } = req.body;
  if (!name || !location) {
    return res.status(400).json({ message: 'Name and location are required' });
  }

  try {
    const existingLead = await prisma.lead.findUnique({
      where: {
        placesId: additionalData.placesId,
      }
    })

    if (existingLead) {
      return res.status(409).json({ message: 'Lead with this Places ID already exists' });
    }

    const lead = await prisma.lead.create({
      data: {
        userId,
        name,
        website: website || null,
        location,
        mapsUri: additionalData.googleMapsUri ?? null,
        placesId: additionalData.placesId ?? null,
      },
      include: {
        lists: { select: 
          { list: { select: { id: true, name: true } } }
        }
      }
    });

    const shapedLead = {
      ...lead,
      lists: lead.lists.map(x => x.list) // [{id, name}]
    };

    res.status(201).json(shapedLead);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create lead', error: err.message });
  }
});

// routes/leads.js (delete route)
router.delete('/:id', async (req, res) => {
  const userId = req.user.userId;
  const leadId = req.params.id;

  try {
    // Auth check: ensure the lead belongs to the user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
    });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    await prisma.$transaction([
      prisma.leadSource.deleteMany({ where: { leadId } }),
      prisma.leadList.deleteMany({ where: { leadId } }),            
      prisma.leadEnrichmentLog.deleteMany({ where: { leadId } }),
      prisma.lead.delete({ where: { id: leadId } }),
    ]);

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete lead', error: err.message });
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
  const userId = req.user.userId;
  const leadId = req.params.id;

  try{
    const { updatedLead, gptEval } = await enrichIdentity({
      userId,
      leadId,
    });

    return res.json({ updatedLead, gptEval });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to enrich identity', error: error.message });
  }
})

router.post('/:id/enrich/contact', async (req, res) => {
  const userId = req.user.userId;
  const leadId = req.params.id;

  try {
    const { updatedLead, eval } = await enrichContact({
      userId,
      leadId,
    });

    return res.json({ updatedLead, eval });
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

router.get('/:id/enrich/status/:goal', async (req, res) => {
  const userId = req.user.userId;
  const leadId = req.params.id;
  const goal = req.params.goal;

  try {
    const log = await getLatestLog({ userId, leadId, goal });
    res.json({ log });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrichment status', error: error.message });
  }
})

module.exports = router;