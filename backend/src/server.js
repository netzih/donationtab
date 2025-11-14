const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const stripeRoutes = require('./routes/stripe');
const donationRoutes = require('./routes/donations');
const receiptRoutes = require('./routes/receipts');
const adminRoutes = require('./routes/admin');

// Import database initialization
const {initDatabase} = require('./database/db');

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
app.use('/stripe', stripeRoutes);
app.use('/donations', donationRoutes);
app.use('/receipts', receiptRoutes);
app.use('/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({status: 'ok', timestamp: new Date().toISOString()});
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DonationTab API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/stripe/connection-token',
      '/stripe/payment-intent',
      '/donations',
      '/receipts/send',
      '/admin/login',
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
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
