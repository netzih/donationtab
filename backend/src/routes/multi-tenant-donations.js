const express = require('express');
const router = express.Router();
const {query, run} = require('../database/multi-tenant-db');
const {v4: uuidv4} = require('crypto');

// Create a new donation (organization-specific)
router.post('/:orgId', async (req, res) => {
  try {
    const {orgId} = req.params;
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
        id, organization_id, amount, currency, donor_name, donor_email,
        wants_receipt, stripe_payment_intent_id, status, receipt_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        donationId,
        orgId,
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

// Get all donations for an organization
router.get('/:orgId', async (req, res) => {
  try {
    const {orgId} = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const donations = await query(
      `SELECT * FROM donations
       WHERE organization_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [orgId, limit]
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

// Update donation receipt status
router.patch('/:orgId/:id/receipt-sent', async (req, res) => {
  try {
    const {orgId, id} = req.params;
    await run(
      `UPDATE donations SET receipt_sent = 1
       WHERE id = ? AND organization_id = ?`,
      [id, orgId]
    );
    res.json({success: true});
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
