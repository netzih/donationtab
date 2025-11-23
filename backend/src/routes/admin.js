const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const {password} = req.body;

    if (!password) {
      return res.status(400).json({error: 'Password is required'});
    }

    // Get password hash from environment
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!passwordHash) {
      // Fallback for development - default password is "admin123"
      const defaultPassword = 'admin123';
      const isValid = password === defaultPassword;

      if (!isValid) {
        return res.status(401).json({error: 'Invalid password'});
      }
    } else {
      // Compare with hashed password
      const isValid = await bcrypt.compare(password, passwordHash);

      if (!isValid) {
        return res.status(401).json({error: 'Invalid password'});
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {role: 'admin'},
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      {expiresIn: '24h'}
    );

    res.json({token, expiresIn: 86400});
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({error: 'Login failed'});
  }
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
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

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({error: 'Invalid token'});
  }
};

// Protected admin routes
router.get('/verify', verifyAdmin, (req, res) => {
  res.json({valid: true});
});

// Utility endpoint to generate password hash (development only)
router.post('/generate-hash', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({error: 'Not available in production'});
  }

  const {password} = req.body;
  if (!password) {
    return res.status(400).json({error: 'Password is required'});
  }

  const hash = await bcrypt.hash(password, 10);
  res.json({hash});
});

module.exports = router;
