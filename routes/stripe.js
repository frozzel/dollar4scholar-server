// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();

const YOUR_DOMAIN = 'http://localhost:5173';

router.post('/create-checkout-session', async (req, res) => {
    console.log('New Session Checkout')
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: 'price_1O6wJfDJqC99h37U8md7z8n5',
        quantity: 1,
      },
    ],
    mode: 'payment',
    return_url: `${YOUR_DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
  });
  if(!session) return res.status(404).send('No session found');
  res.send({clientSecret: session.client_secret});
});

router.get('/session-status', async (req, res) => {
    console.log('Status Request')
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  if(!session) return res.status(404).send('No session found');

  res.send({
    status: session.status,
    customer_email: session.customer_details.email
  });
});

module.exports = router;