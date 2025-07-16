// /backend/routes/billing.js
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create a Checkout session
router.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body; // predefined Stripe Price ID

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
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;