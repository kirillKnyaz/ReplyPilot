// /backend/routes/billing.js
const express = require("express");
const Stripe = require("stripe");
const { PrismaClient } = require("@prisma/client"); // Adjust the path as necessary
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

// Create a Checkout session
router.post("/create-checkout-session", async (req, res) => {
  const { userId, priceId } = req.body; // predefined Stripe Price ID

  // check user has subscription
  const existing = await prisma.subscription.findUnique({
    where: { userId: userId },
  });

  if (existing) {
    return res.status(400).json({ message: "User already has a subscription" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/billing/success`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
      metadata: {
        userId: userId, // Store user ID in metadata
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message});
  }
});

router.get("/subscription", async (req, res) => {
  const userId = req.user.userId; // Assuming you have user authentication middleware
  console.log("Fetching subscription for user:", userId);

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Optionally, you can fetch more details about the subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeId);
    const product = await stripe.products.retrieve(stripeSubscription.items.data[0].price.product);

    res.json({ ...stripeSubscription, productName: product.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/cancel', async (req, res) => {
  const userId = req.user.userId;
  
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId: userId },
  });

  if (!existingSubscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  if (existingSubscription.cancel_at_period_end) {
    return res.status(400).json({ message: "Subscription is already set to cancel at period end" });
  }

  const canceled = await stripe.subscriptions.update(existingSubscription.stripeId, {
    cancel_at_period_end: true, // ⏳ Cancel when current period ends
  });

  await prisma.subscription.update({
    where: { stripeId: existingSubscription.stripeId },
    data: {
      cancel_at_period_end: true,
      current_period_end: canceled.items.data[0].current_period_end,
    }
  });

  const product = await stripe.products.retrieve(canceled.items.data[0].price.product);
  res.json({ ...canceled, productName: product.name });
});

router.post('/renew', async (req, res) => {
  const userId = req.user.userId;

  // is subscription still active?
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId: userId },
  });

  if (!existingSubscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.stripeId);

  // if subscription is active, no need to renew
  if (stripeSubscription.cancel_at_period_end === false) {
    const product = await stripe.products.retrieve(stripeSubscription.items.data[0].price.product);
    return res.status(200).json({ ...stripeSubscription, productName: product.name, message: "Subscription is still active" });
  }
  
  // subscription is still active but cancelled
  if (stripeSubscription.cancel_at_period_end === true && stripeSubscription.status === 'active') {
    const renewed = await stripe.subscriptions.update(existingSubscription.stripeId, {
      cancel_at_period_end: false, // Reactivate the subscription
    });

    await prisma.subscription.update({
      where: { stripeId: existingSubscription.stripeId },
      data: {
        active: true,
        cancel_at_period_end: false,
        current_period_end: renewed.items.data[0].current_period_end,
      }
    });

    const product = await stripe.products.retrieve(renewed.items.data[0].price.product);
    return res.json({ ...renewed, productName: product.name });
  }

  // Inactive subscription -> create a new subscription
  if (stripeSubscription.status === 'canceled') {
    return res.status(410).json({ message: "Subscription is canceled, please subscribe again" });
  }
});

router.post('/full-cancel', async (req, res) => {
  const userId = req.user.userId;

  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId: userId },
  });

  if (!existingSubscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  await stripe.subscriptions.cancel(existingSubscription.stripeId);

  await prisma.subscription.update({
    where: { userId: userId },
    data: {
      active: false,
      cancel_at_period_end: true,
      current_period_end: existingSubscription.current_period_end,
      status: 'canceled',
    }
  })

  res.json({ message: "Subscription fully canceled" });
})

module.exports = router;