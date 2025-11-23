const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {get} = require('../database/multi-tenant-db');

// Organization-specific admin login
router.post('/login/:orgSlug', async (req, res) => {
  try {
    const {orgSlug} = req.params;
    const {password} = req.body;

    if (!password) {
      return res.status(400).json({error: 'Password is required'});
    }

    // Get organization by slug
    const org = await get(
      'SELECT id, name, slug, admin_password_hash FROM organizations WHERE slug = ? AND is_active = 1',
      [orgSlug]
    );

    if (!org) {
      return res.status(404).json({error: 'Organization not found'});
    }

    // Verify password
    const isValid = await bcrypt.compare(password, org.admin_password_hash);

    if (!isValid) {
      return res.status(401).json({error: 'Invalid password'});
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        organizationId: org.id,
        organizationSlug: org.slug,
        role: 'admin',
      },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      {expiresIn: '24h'}
    );

    res.json({
      token,
      expiresIn: 86400,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({error: 'Login failed'});
  }
});

// Middleware to verify organization admin token
const verifyOrgAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({error: 'No token provided'});
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    );

    if (decoded.role !== 'admin') {
      return res.status(403).json({error: 'Insufficient permissions'});
    }

    req.organizationId = decoded.organizationId;
    req.organizationSlug = decoded.organizationSlug;
    next();
  } catch (error) {
    return res.status(401).json({error: 'Invalid token'});
  }
};

// Verify token endpoint
router.get('/verify', verifyOrgAdmin, (req, res) => {
  res.json({
    valid: true,
    organizationId: req.organizationId,
    organizationSlug: req.organizationSlug,
  });
});

// Change admin password
router.post('/change-password', verifyOrgAdmin, async (req, res) => {
  try {
    const {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long',
      });
    }

    // Get current password hash
    const org = await get(
      'SELECT admin_password_hash FROM organizations WHERE id = ?',
      [req.organizationId]
    );

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, org.admin_password_hash);

    if (!isValid) {
      return res.status(401).json({error: 'Current password is incorrect'});
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await run(
      'UPDATE organizations SET admin_password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, req.organizationId]
    );

    res.json({success: true, message: 'Password updated successfully'});
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({error: 'Failed to change password'});
  }
});

module.exports = {router, verifyOrgAdmin};
