const express = require('express');
const router = express.Router();
const {query, get, run} = require('../database/multi-tenant-db');
const bcrypt = require('bcrypt');
const {v4: uuidv4} = require('crypto');

// Create slug from organization name
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Register new organization (public endpoint)
router.post('/register', async (req, res) => {
  try {
    const {name, email, password, address, taxId} = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Organization name, email, and password are required',
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
    }

    // Create slug
    const baseSlug = createSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const existing = await get(
        'SELECT id FROM organizations WHERE slug = ?',
        [slug]
      );
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create organization
    const orgId = uuidv4();

    const defaultTemplate = `Dear {name},

Thank you for your generous donation of {amount} to ${name}.

Your donation helps us continue our mission and make a difference.

Tax ID: {taxId}
Donation Date: {date}
Amount: {amount}

This email serves as your receipt for tax purposes.

With gratitude,
${name} Team`;

    await run(
      `INSERT INTO organizations (
        id, name, slug, email, address, tax_id,
        admin_password_hash, email_template, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [orgId, name, slug, email, address || '', taxId || '', passwordHash, defaultTemplate]
    );

    // Create default donation amounts
    const defaultAmounts = [
      {amount: 10, label: '$10'},
      {amount: 25, label: '$25'},
      {amount: 50, label: '$50'},
      {amount: 100, label: '$100'},
    ];

    for (let i = 0; i < defaultAmounts.length; i++) {
      await run(
        `INSERT INTO donation_amounts (id, organization_id, amount, label, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), orgId, defaultAmounts[i].amount, defaultAmounts[i].label, i]
      );
    }

    res.status(201).json({
      success: true,
      organization: {
        id: orgId,
        name,
        slug,
        email,
      },
      message: 'Organization registered successfully',
      setupUrl: `/org/${slug}/setup`,
    });
  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({error: error.message});
  }
});

// Get organization by slug (public endpoint for app initialization)
router.get('/slug/:slug', async (req, res) => {
  try {
    const {slug} = req.params;

    const org = await get(
      `SELECT id, name, slug, email, address, tax_id, logo_url,
              stripe_publishable_key, stripe_location_id, email_template,
              allow_custom_amount, is_active
       FROM organizations WHERE slug = ? AND is_active = 1`,
      [slug]
    );

    if (!org) {
      return res.status(404).json({error: 'Organization not found'});
    }

    // Get donation amounts
    const amounts = await query(
      `SELECT id, amount, label FROM donation_amounts
       WHERE organization_id = ? AND is_active = 1
       ORDER BY sort_order`,
      [org.id]
    );

    res.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      address: org.address,
      taxId: org.tax_id,
      logoUrl: org.logo_url,
      stripePublishableKey: org.stripe_publishable_key,
      stripeLocationId: org.stripe_location_id,
      emailTemplate: org.email_template,
      allowCustomAmount: Boolean(org.allow_custom_amount),
      donationAmounts: amounts.map(a => ({
        id: a.id,
        amount: a.amount,
        label: a.label,
      })),
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({error: error.message});
  }
});

// List all active organizations (public endpoint for org selector)
router.get('/list', async (req, res) => {
  try {
    const orgs = await query(
      `SELECT id, name, slug, logo_url FROM organizations
       WHERE is_active = 1 ORDER BY name`
    );

    res.json(
      orgs.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        logoUrl: o.logo_url,
      }))
    );
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({error: error.message});
  }
});

// Update organization (requires auth)
router.patch('/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {
      name,
      email,
      address,
      taxId,
      logoUrl,
      stripePublishableKey,
      stripeSecretKey,
      stripeLocationId,
      emailTemplate,
      allowCustomAmount,
    } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (taxId !== undefined) {
      updates.push('tax_id = ?');
      values.push(taxId);
    }
    if (logoUrl !== undefined) {
      updates.push('logo_url = ?');
      values.push(logoUrl);
    }
    if (stripePublishableKey !== undefined) {
      updates.push('stripe_publishable_key = ?');
      values.push(stripePublishableKey);
    }
    if (stripeSecretKey !== undefined) {
      updates.push('stripe_secret_key = ?');
      values.push(stripeSecretKey);
    }
    if (stripeLocationId !== undefined) {
      updates.push('stripe_location_id = ?');
      values.push(stripeLocationId);
    }
    if (emailTemplate !== undefined) {
      updates.push('email_template = ?');
      values.push(emailTemplate);
    }
    if (allowCustomAmount !== undefined) {
      updates.push('allow_custom_amount = ?');
      values.push(allowCustomAmount ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No updates provided'});
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await run(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({success: true});
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({error: error.message});
  }
});

// Get organization statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const {id} = req.params;

    const stats = await get(
      `SELECT
        COUNT(*) as total_donations,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        COUNT(CASE WHEN receipt_sent = 1 THEN 1 END) as receipts_sent
       FROM donations
       WHERE organization_id = ? AND status = 'completed'`,
      [id]
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
