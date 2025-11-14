const express = require('express');
const router = express.Router();
const {query, run} = require('../database/db');
const {v4: uuidv4} = require('crypto');

// Create a new donation
router.post('/', async (req, res) => {
  try {
    const {
      amount,
      currency = 'usd',
      donorInfo,
      stripePaymentIntentId,
      status,
    } = req.body;

    if (!amount || !stripePaymentIntentId || !status) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const donationId = uuidv4();
    const donorName = donorInfo?.name || null;
    const donorEmail = donorInfo?.email || null;
    const wantsReceipt = donorInfo?.wantsReceipt ? 1 : 0;

    await run(
      `INSERT INTO donations (
        id, amount, currency, donor_name, donor_email,
        wants_receipt, stripe_payment_intent_id, status, receipt_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        donationId,
        amount,
        currency,
        donorName,
        donorEmail,
        wantsReceipt,
        stripePaymentIntentId,
        status,
      ]
    );

    const donation = {
      id: donationId,
      amount,
      currency,
      donorInfo: donorName || donorEmail ? {
        name: donorName,
        email: donorEmail,
        wantsReceipt: Boolean(wantsReceipt),
      } : undefined,
      stripePaymentIntentId,
      status,
      receiptSent: false,
      timestamp: new Date(),
    };

    res.status(201).json(donation);
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({error: error.message});
  }
});

// Get all donations (with optional limit)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const donations = await query(
      `SELECT * FROM donations ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );

    const formattedDonations = donations.map(d => ({
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      donorInfo: d.donor_name || d.donor_email ? {
        name: d.donor_name,
        email: d.donor_email,
        wantsReceipt: Boolean(d.wants_receipt),
      } : undefined,
      stripePaymentIntentId: d.stripe_payment_intent_id,
      status: d.status,
      receiptSent: Boolean(d.receipt_sent),
      timestamp: new Date(d.created_at),
    }));

    res.json(formattedDonations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({error: error.message});
  }
});

// Get a specific donation
router.get('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const donation = await query(
      `SELECT * FROM donations WHERE id = ?`,
      [id]
    );

    if (donation.length === 0) {
      return res.status(404).json({error: 'Donation not found'});
    }

    const d = donation[0];
    const formattedDonation = {
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      donorInfo: d.donor_name || d.donor_email ? {
        name: d.donor_name,
        email: d.donor_email,
        wantsReceipt: Boolean(d.wants_receipt),
      } : undefined,
      stripePaymentIntentId: d.stripe_payment_intent_id,
      status: d.status,
      receiptSent: Boolean(d.receipt_sent),
      timestamp: new Date(d.created_at),
    };

    res.json(formattedDonation);
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({error: error.message});
  }
});

// Update donation receipt status
router.patch('/:id/receipt-sent', async (req, res) => {
  try {
    const {id} = req.params;
    await run(
      `UPDATE donations SET receipt_sent = 1 WHERE id = ?`,
      [id]
    );
    res.json({success: true});
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({error: error.message});
  }
});

// Get donation statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_donations,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        COUNT(CASE WHEN receipt_sent = 1 THEN 1 END) as receipts_sent
      FROM donations
      WHERE status = 'completed'
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
