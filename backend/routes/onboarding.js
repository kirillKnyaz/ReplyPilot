const router = require('express').Router();
const prisma = require('../lib/prisma.js');
const { generateICPSummary } = require('../service/gpt');

router.post('/q', async (req, res) => {
  const userId = req.user.userId;
  const formData = req.body;

  try {
    await prisma.userProfile.upsert({
      where: { userId },
      update: { profileData: formData },
      create: { userId, profileData: formData }
    });

    res.status(200).json({ message: 'Profile data saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save profile', error: err.message });
  }
});

router.post('/icp', async (req, res) => {
  const userId = req.user.userId;
  const profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile?.profileData) {
    return res.status(400).json({ error: 'No onboarding data found' });
  }

  const icp = await generateICPSummary(profile.profileData);

  await prisma.userProfile.update({
    where: { userId },
    data: { icpSummary: icp }
  });

  res.json({ icp });
});

module.exports = router;