const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/donations.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, {recursive: true});
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize multi-tenant database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Organizations table
      db.run(
        `CREATE TABLE IF NOT EXISTS organizations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          address TEXT,
          tax_id TEXT,
          logo_url TEXT,
          stripe_publishable_key TEXT,
          stripe_secret_key TEXT,
          stripe_location_id TEXT,
          email_template TEXT,
          admin_password_hash TEXT NOT NULL,
          allow_custom_amount INTEGER DEFAULT 1,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) console.error('Error creating organizations table:', err);
        }
      );

      // Donation amounts table (per organization)
      db.run(
        `CREATE TABLE IF NOT EXISTS donation_amounts (
          id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          amount REAL NOT NULL,
          label TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
        )`,
        (err) => {
          if (err) console.error('Error creating donation_amounts table:', err);
        }
      );

      // Donations table (with organization reference)
      db.run(
        `CREATE TABLE IF NOT EXISTS donations (
          id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          donor_name TEXT,
          donor_email TEXT,
          wants_receipt INTEGER DEFAULT 0,
          stripe_payment_intent_id TEXT NOT NULL,
          status TEXT NOT NULL,
          receipt_sent INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
        )`,
        (err) => {
          if (err) console.error('Error creating donations table:', err);
        }
      );

      // Email configuration table (per organization)
      db.run(
        `CREATE TABLE IF NOT EXISTS email_config (
          id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          smtp_host TEXT,
          smtp_port INTEGER,
          smtp_user TEXT,
          smtp_password TEXT,
          smtp_secure INTEGER DEFAULT 0,
          from_name TEXT,
          from_email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
        )`,
        (err) => {
          if (err) {
            console.error('Error creating email_config table:', err);
          } else {
            console.log('Multi-tenant database tables initialized');
            resolve();
          }
        }
      );
    });
  });
};

// Helper function to run queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to run single row queries
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to run insert/update/delete queries
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({lastID: this.lastID, changes: this.changes});
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
  query,
  get,
  run,
};
