const express = require('express');
const router = express.Router();
const {sendReceiptEmail} = require('../services/emailService');
const {query, run} = require('../database/db');

// Send receipt email
router.post('/send', async (req, res) => {
  try {
    const {donationId, donorInfo, amount} = req.body;

    if (!donationId || !donorInfo || !amount) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    if (!donorInfo.email || !donorInfo.name) {
      return res.status(400).json({error: 'Donor name and email are required'});
    }

    // Get donation from database
    const donations = await query(
      `SELECT * FROM donations WHERE id = ?`,
      [donationId]
    );

    if (donations.length === 0) {
      return res.status(404).json({error: 'Donation not found'});
    }

    const donation = donations[0];

    // Send the receipt email
    await sendReceiptEmail(donorInfo, amount, donation);

    // Mark receipt as sent
    await run(
      `UPDATE donations SET receipt_sent = 1, donor_name = ?, donor_email = ? WHERE id = ?`,
      [donorInfo.name, donorInfo.email, donationId]
    );

    res.json({success: true, message: 'Receipt sent successfully'});
  } catch (error) {
    console.error('Error sending receipt:', error);
    res.status(500).json({error: error.message});
  }
});

// Resend receipt
router.post('/resend/:donationId', async (req, res) => {
  try {
    const {donationId} = req.params;

    const donations = await query(
      `SELECT * FROM donations WHERE id = ?`,
      [donationId]
    );

    if (donations.length === 0) {
      return res.status(404).json({error: 'Donation not found'});
    }

    const donation = donations[0];

    if (!donation.donor_email || !donation.donor_name) {
      return res.status(400).json({error: 'No donor information available'});
    }

    const donorInfo = {
      name: donation.donor_name,
      email: donation.donor_email,
      wantsReceipt: true,
    };

    await sendReceiptEmail(donorInfo, donation.amount, donation);

    res.json({success: true, message: 'Receipt resent successfully'});
  } catch (error) {
    console.error('Error resending receipt:', error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
