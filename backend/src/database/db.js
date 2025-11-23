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

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Donations table
      db.run(
        `CREATE TABLE IF NOT EXISTS donations (
          id TEXT PRIMARY KEY,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          donor_name TEXT,
          donor_email TEXT,
          wants_receipt INTEGER DEFAULT 0,
          stripe_payment_intent_id TEXT NOT NULL,
          status TEXT NOT NULL,
          receipt_sent INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) {
            console.error('Error creating donations table:', err);
            reject(err);
          }
        }
      );

      // Configuration table
      db.run(
        `CREATE TABLE IF NOT EXISTS configuration (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) {
            console.error('Error creating configuration table:', err);
            reject(err);
          } else {
            console.log('Database tables initialized');
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
