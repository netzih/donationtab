# Deployment Guide

This guide covers deploying DonationTab to production.

## Backend Deployment

### Option 1: Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
cd backend
heroku create your-app-name

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set ORG_NAME="Your Organization"
# ... add all other env vars

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### Option 2: DigitalOcean App Platform

1. Go to DigitalOcean Dashboard
2. Create New App
3. Connect GitHub repository
4. Select backend directory
5. Set environment variables
6. Deploy

### Option 3: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd backend
railway init

# Set environment variables
railway variables set STRIPE_SECRET_KEY=sk_live_xxx
# ... add all other env vars

# Deploy
railway up
```

### Option 4: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init -p node.js your-app-name

# Create environment
eb create production

# Set environment variables
eb setenv STRIPE_SECRET_KEY=sk_live_xxx
# ... add all other env vars

# Deploy
eb deploy
```

## Database Migration

### From SQLite to PostgreSQL

1. **Install PostgreSQL client**
```bash
npm install pg
```

2. **Update database connection**

Create `backend/src/database/postgres.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Migrate your queries to use pool instead of sqlite
```

3. **Create tables**
```sql
CREATE TABLE donations (
  id VARCHAR(36) PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  wants_receipt BOOLEAN DEFAULT false,
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  receipt_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuration (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Android App Deployment

### Build Release APK

1. **Generate signing key**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing**

Edit `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=****
MYAPP_RELEASE_KEY_PASSWORD=****
```

Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

3. **Build APK**
```bash
cd android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

### Publish to Google Play Store

1. **Create Developer Account**
   - Go to https://play.google.com/console
   - Pay $25 registration fee
   - Complete verification

2. **Create App**
   - Click "Create App"
   - Fill in details
   - Upload screenshots
   - Add description

3. **Upload APK/AAB**
```bash
# Build App Bundle (recommended)
cd android
./gradlew bundleRelease
```

Upload: `android/app/build/outputs/bundle/release/app-release.aab`

4. **Submit for Review**

## Environment Configuration

### Production Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=3001

# Stripe (PRODUCTION KEYS!)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=donations@yourorg.com
EMAIL_PASSWORD=app-specific-password

# Admin
ADMIN_PASSWORD_HASH=$2b$10$yourhash
JWT_SECRET=your-very-secure-random-secret-min-32-chars

# Organization
ORG_NAME=Your Organization Name
ORG_EMAIL=donations@yourorg.com
ORG_ADDRESS=123 Main St, City, State 12345
ORG_TAX_ID=12-3456789
```

**App (.env):**
```env
API_URL=https://your-backend.com
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

## SSL/HTTPS Configuration

### Option 1: Let's Encrypt (if using VPS)

```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Cloudflare

1. Add your domain to Cloudflare
2. Enable SSL/TLS
3. Set SSL/TLS mode to "Full"
4. Create DNS record pointing to your server

## Monitoring and Logging

### Option 1: PM2 (for VPS)

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start src/server.js --name donationtab-api

# Save config
pm2 save

# Auto-start on reboot
pm2 startup
```

### Option 2: Application Insights (Azure)

```javascript
const appInsights = require('applicationinsights');
appInsights.setup('YOUR_INSTRUMENTATION_KEY').start();
```

### Option 3: Sentry

```bash
npm install @sentry/node

# In server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'YOUR_DSN' });
```

## Performance Optimization

### Backend
- Enable gzip compression
- Add Redis for caching
- Implement rate limiting
- Use connection pooling

### Database
- Add indexes
- Optimize queries
- Regular backups

### App
- Enable Hermes engine
- Optimize images
- Minimize bundle size

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Production Stripe keys only
- [ ] Secure admin password
- [ ] Random JWT secret (32+ chars)
- [ ] Environment variables (not hardcoded)
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection protection
- [ ] CORS configured properly
- [ ] Regular dependency updates
- [ ] Error messages don't leak info
- [ ] Logs don't contain secrets

## Backup Strategy

### Database Backups

**Automated (PostgreSQL):**
```bash
# Daily backup cron job
0 2 * * * pg_dump dbname > backup-$(date +\%Y\%m\%d).sql
```

**Heroku:**
```bash
heroku pg:backups:schedule --at '02:00 America/New_York'
```

### Configuration Backups

- Store .env templates in secure location
- Document all configuration changes
- Version control everything except secrets

## Rollback Plan

1. Keep previous version available
2. Test rollback procedure
3. Have database backup ready
4. Document rollback steps

```bash
# Example rollback
heroku rollback
# or
git revert HEAD
git push heroku main
```

## Post-Deployment

1. **Test all functionality**
   - Donation flow
   - Receipt emails
   - Admin panel
   - Payment processing

2. **Monitor logs**
   - Check for errors
   - Monitor performance
   - Track donations

3. **Set up alerts**
   - Server downtime
   - Failed payments
   - Email failures
   - High error rates

## Support

For deployment help:
- Check service-specific docs
- Open GitHub issue
- Contact support team
