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
  const { stripeSubscriptionId } = req.body;

  const canceled = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true, // ⏳ Cancel when current period ends
  });

  await prisma.subscription.update({
    where: { stripeId: stripeSubscriptionId},
    data: {
      cancel_at_period_end: true,
      current_period_end: canceled.items.data[0].current_period_end,
    }
  })

  res.json({ canceled });
});

router.post('/renew', async (req, res) => {
  const { stripeSubscriptionId } = req.body;

  const renewed = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false, // ⏳ Renew the subscription
  });

  res.json({ renewed });
});

module.exports = router;