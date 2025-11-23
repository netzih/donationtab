const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Generate Stripe Terminal connection token
router.post('/connection-token', async (req, res) => {
  try {
    const connectionToken = await stripe.terminal.connectionTokens.create();
    res.json({secret: connectionToken.secret});
  } catch (error) {
    console.error('Error creating connection token:', error);
    res.status(500).json({error: error.message});
  }
});

// Create payment intent
router.post('/payment-intent', async (req, res) => {
  try {
    const {amount, currency = 'usd'} = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({error: 'Invalid amount'});
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({error: error.message});
  }
});

// Get payment intent status
router.get('/payment-intent/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    res.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({error: error.message});
  }
});

// List Stripe Terminal readers
router.get('/readers', async (req, res) => {
  try {
    const readers = await stripe.terminal.readers.list({limit: 100});
    res.json(readers.data);
  } catch (error) {
    console.error('Error listing readers:', error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
