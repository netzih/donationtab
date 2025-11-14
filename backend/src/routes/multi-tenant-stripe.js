const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const {get} = require('../database/multi-tenant-db');

// Get Stripe instance for organization
const getStripeForOrg = async (orgId) => {
  const org = await get(
    'SELECT stripe_secret_key FROM organizations WHERE id = ? AND is_active = 1',
    [orgId]
  );

  if (!org || !org.stripe_secret_key) {
    throw new Error('Stripe not configured for this organization');
  }

  return new Stripe(org.stripe_secret_key);
};

// Generate Stripe Terminal connection token (organization-specific)
router.post('/connection-token/:orgId', async (req, res) => {
  try {
    const {orgId} = req.params;
    const stripe = await getStripeForOrg(orgId);

    const connectionToken = await stripe.terminal.connectionTokens.create();
    res.json({secret: connectionToken.secret});
  } catch (error) {
    console.error('Error creating connection token:', error);
    res.status(500).json({error: error.message});
  }
});

// Create payment intent (organization-specific)
router.post('/payment-intent/:orgId', async (req, res) => {
  try {
    const {orgId} = req.params;
    const {amount, currency = 'usd'} = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({error: 'Invalid amount'});
    }

    const stripe = await getStripeForOrg(orgId);

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
router.get('/payment-intent/:orgId/:id', async (req, res) => {
  try {
    const {orgId, id} = req.params;
    const stripe = await getStripeForOrg(orgId);

    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    res.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
