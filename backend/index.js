require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('./middleware/authenticate');
const Stripe = require("stripe");

const app = express();
const prisma = new PrismaClient();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Webhook to handle Stripe events
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const stripeSubscriptionId = session.subscription;
    const stripeCustomerId = session.customer;

    // Fetch full subscription details
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const existing = await prisma.subscription.findUnique({ where: { stripeId: subscription.id } });
    if (!existing) {
      await prisma.subscription.create({
        data: {
          userId,
          stripeId: stripeSubscriptionId,
          tier,
          active: true,
          cancel_at_period_end: false,
          current_period_end: subscription.items.data[0].current_period_end,
        },
      });
    } else {
      await prisma.subscription.update({
        where: { stripeId: subscription.id },
        data: {
          active: true,
          cancel_at_period_end: false,
          current_period_end: subscription.items.data[0].current_period_end,
        },
      });
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const session = event.data.object;
    const subscription = await stripe.subscriptions.retrieve(session.subscription);    

    await prisma.subscription.update({
      where: { stripeId: subscription.id },
      data: {
        active: !subscription.cancel_at_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.items.data[0].current_period_end,
      },
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    await prisma.subscription.update({
      where: { stripeId: subscription.id },
      data: {
        active: false,        
      },
    });
  }

  res.sendStatus(200);
});

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/onboarding', authenticate, require('./routes/onboarding'));
app.use('/api/billing', authenticate, require('./routes/billing'));

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);