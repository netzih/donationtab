const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const organizationsRoutes = require('./routes/organizations');
const {router: adminRoutes} = require('./routes/multi-tenant-admin');
const stripeRoutes = require('./routes/multi-tenant-stripe');
const donationRoutes = require('./routes/multi-tenant-donations');
const receiptRoutes = require('./routes/receipts'); // Will need to update this too

// Import database initialization
const {initDatabase} = require('./database/multi-tenant-db');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/organizations', organizationsRoutes);
app.use('/admin', adminRoutes);
app.use('/stripe', stripeRoutes);
app.use('/donations', donationRoutes);
app.use('/receipts', receiptRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({status: 'ok', timestamp: new Date().toISOString()});
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DonationTab Multi-Tenant API',
    version: '2.0.0',
    features: ['multi-organization', 'stripe-terminal', 'email-receipts'],
    endpoints: [
      'GET /health',
      'GET /organizations/list',
      'GET /organizations/slug/:slug',
      'POST /organizations/register',
      'POST /admin/login/:orgSlug',
      'POST /stripe/connection-token/:orgId',
      'POST /stripe/payment-intent/:orgId',
      'POST /donations/:orgId',
      'GET /donations/:orgId',
      'POST /receipts/send',
    ],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({error: 'Endpoint not found'});
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    console.log('Multi-tenant database initialized successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`DonationTab Multi-Tenant Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://0.0.0.0:${PORT}`);
      console.log('');
      console.log('📱 Multi-Organization Support Enabled');
      console.log('🔐 Each organization has its own Stripe keys and settings');
      console.log('');
      console.log('To register an organization:');
      console.log(`POST http://localhost:${PORT}/organizations/register`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
