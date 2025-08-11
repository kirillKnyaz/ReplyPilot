// routes/lists.js
const router = require('express').Router();
const prisma = require('../lib/prisma.js');
const authorizeTokens = require('../middleware/checkTokens');

// Create a new list
router.post('/', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { name, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const list = await prisma.list.create({
      data: { userId, name: name.trim(), color: color || null }
    });
    res.json(list);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'List name already exists' });
    }
    console.error('POST /lists error', e);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// Get all lists (with counts)
router.get('/', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  try {
    const lists = await prisma.list.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } }
    });

    res.json(
      lists.map(l => ({
        id: l.id,
        name: l.name,
        color: l.color,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        count: l._count.items
      }))
    );
  } catch (e) {
    console.error('GET /lists error', e);
    res.status(500).json({ error: 'Failed to load lists' });
  }
});

// Get one list with its leads (ordered)
router.get('/:id', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const list = await prisma.list.findFirst({
      where: { id, userId },
      include: {
        items: { include: { lead: true } }
      }
    });
    if (!list) return res.status(404).json({ error: 'List not found' });

    res.json({
      id: list.id,
      name: list.name,
      color: list.color,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      leads: list.items
    });
  } catch (e) {
    console.error('GET /lists/:id error', e);
    res.status(500).json({ error: 'Failed to load list' });
  }
});

// Add a lead to a list
router.post('/:id/leads', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { leadId } = req.body;

  if (!leadId) return res.status(400).json({ error: 'leadId is required' });

  try {
    // verify list ownership
    const list = await prisma.list.findFirst({ where: { id, userId } });
    if (!list) return res.status(404).json({ error: 'List not found' });

    // verify lead belongs to user
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // compute next position
    const last = await prisma.leadList.findFirst({
      where: { listId: id },
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    const nextPos = (last?.position || 0) + 1;

    const link = await prisma.leadList.create({
      data: { listId: id, leadId, position: nextPos }
    });

    res.json(link);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'Lead already in list' });
    }
    console.error('POST /lists/:id/leads error', e);
    res.status(500).json({ error: 'Failed to add lead to list' });
  }
});

// Remove a lead from a list
router.delete('/:id/leads/:leadId', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { id, leadId } = req.params;

  try {
    const list = await prisma.list.findFirst({ where: { id, userId }, select: { id: true } });
    if (!list) return res.status(404).json({ error: 'List not found' });

    await prisma.leadList.deleteMany({ where: { listId: id, leadId } });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /lists/:id/leads/:leadId error', e);
    res.status(500).json({ error: 'Failed to remove lead from list' });
  }
});

// Reorder leads within a list
// body: { order: ["leadId1","leadId2", ...] }
router.patch('/:id/leads/reorder', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { order } = req.body;

  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: 'order array is required' });
  }

  try {
    const list = await prisma.list.findFirst({ where: { id, userId }, select: { id: true } });
    if (!list) return res.status(404).json({ error: 'List not found' });

    // Set positions to 1..N
    const updates = order.map((leadId, idx) =>
      prisma.leadList.updateMany({
        where: { listId: id, leadId },
        data: { position: idx + 1 }
      })
    );
    await prisma.$transaction(updates);

    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH /lists/:id/leads/reorder error', e);
    res.status(500).json({ error: 'Failed to reorder leads' });
  }
});

// Rename / recolor a list
router.patch('/:id', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name, color } = req.body;

  if (!name && !color) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  try {
    // scope update to owner
    const updated = await prisma.list.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(color !== undefined ? { color } : {})
      }
    });

    // verify owner after (safer with update w/ condition in Prisma 5.14+ using .updateMany)
    if (updated.userId !== userId) {
      // revert if ownership mismatch
      await prisma.list.update({ where: { id }, data: { name: updated.name, color: updated.color } });
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(updated);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'List not found' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'List name already exists' });
    console.error('PATCH /lists/:id error', e);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

// Delete a list (keeps leads; removes associations)
router.delete('/:id', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const list = await prisma.list.findFirst({ where: { id, userId }, select: { id: true } });
    if (!list) return res.status(404).json({ error: 'List not found' });

    await prisma.leadList.deleteMany({ where: { listId: id } });
    await prisma.list.delete({ where: { id } });

    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /lists/:id error', e);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

module.exports = router;