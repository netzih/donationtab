# Multi-Tenant Quick Start Guide

This guide will get your DonationTab multi-tenant server running in under 10 minutes on an ARM-based Ubuntu server.

## What is Multi-Tenant?

With multi-tenant support, your single server can host donation apps for **multiple organizations**. Each organization:
- Has its own Stripe API keys
- Manages their own donation amounts
- Configures their own branding (logo, colors, email templates)
- Has separate admin access
- Gets isolated donation records

Perfect for:
- Payment processors serving multiple clients
- Franchises or multi-location organizations
- SaaS donation platforms
- Non-profit networks

## Prerequisites

- ARM-based Ubuntu server (20.04+) or regular x86_64 Ubuntu
- SSH access with sudo privileges
- Domain name (recommended) or IP address
- 30 minutes of your time

## Quick Setup

### 1. Clone and Run Setup Script

```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourorg/donationtab.git
cd donationtab

# Run automated setup (installs Docker, configures services)
./setup.sh
```

The script will:
- ✅ Install Docker & Docker Compose
- ✅ Generate secure secrets
- ✅ Create data directories
- ✅ Set up SSL (optional)
- ✅ Configure firewall
- ✅ Build and start services

### 2. Configure Email (Required)

Edit the environment file:
```bash
nano .env
```

Set your email credentials:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

**For Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Generate new app password
3. Copy the 16-character password
4. Paste into `EMAIL_PASSWORD`

Restart services:
```bash
docker-compose restart backend
```

### 3. Register Your First Organization

```bash
curl -X POST http://localhost:3001/organizations/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Organization",
    "email": "admin@myorg.com",
    "password": "SecurePassword123!",
    "address": "123 Main St, City, State 12345",
    "taxId": "12-3456789"
  }'
```

Response:
```json
{
  "success": true,
  "organization": {
    "id": "uuid-here",
    "name": "My Organization",
    "slug": "my-organization"
  },
  "message": "Organization registered successfully",
  "setupUrl": "/org/my-organization/setup"
}
```

**Important:** Save the `slug` value - you'll need it for the mobile app!

### 4. Test the API

```bash
# Health check
curl http://localhost:3001/health

# Get organization details
curl http://localhost:3001/organizations/slug/my-organization

# List all organizations
curl http://localhost:3001/organizations/list
```

## Mobile App Configuration

### For Each Organization

Each organization needs their own Stripe configuration:

1. **Build the App** with the organization's slug
2. **Launch the app** - it will connect to your server
3. **Admin Login** - use the password from registration
4. **Configure Stripe:**
   - Add Stripe Publishable Key
   - Add Stripe Secret Key
   - Add Stripe Location ID
5. **Set Donation Amounts**
6. **Upload Logo**
7. **Customize Email Template**

### App Environment Variables

In your React Native `.env`:
```env
API_URL=https://your-server.com/api
ORGANIZATION_SLUG=my-organization
```

Or build with organization selector to let users choose on first launch.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Your ARM Ubuntu Server          │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │     Nginx (SSL + Rate Limiting)  │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │   Node.js Multi-Tenant Backend   │  │
│  │   - Organization Management      │  │
│  │   - Stripe Integration (per org) │  │
│  │   - Email Receipts              │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │     SQLite Database              │  │
│  │   - organizations                │  │
│  │   - donations (per org)          │  │
│  │   - donation_amounts             │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘

         ▲              ▲              ▲
         │              │              │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │  Org A  │   │  Org B  │   │  Org C  │
    │  Mobile │   │  Mobile │   │  Mobile │
    │   App   │   │   App   │   │   App   │
    └─────────┘   └─────────┘   └─────────┘
```

## Adding More Organizations

### Option 1: Via API
```bash
curl -X POST https://your-server.com/api/organizations/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Organization",
    "email": "admin@another.org",
    "password": "SecurePass456!"
  }'
```

### Option 2: Via Mobile App
Organizations can self-register through the "Register New Organization" button in the app.

## Managing Organizations

### View All Organizations
```bash
sqlite3 data/database/donations.db "SELECT id, name, slug FROM organizations;"
```

### View Organization Donations
```bash
sqlite3 data/database/donations.db \
  "SELECT * FROM donations WHERE organization_id='ORG_ID_HERE' ORDER BY created_at DESC LIMIT 10;"
```

### Update Organization
```bash
# Change password example
sqlite3 data/database/donations.db <<EOF
UPDATE organizations
SET admin_password_hash = '$(echo -n "NewPassword123!" | bcrypt)'
WHERE slug = 'my-organization';
EOF
```

## Monitoring

### View Logs
```bash
# Real-time logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Error logs only
docker-compose logs backend | grep -i error
```

### Check Service Health
```bash
# Health endpoint
curl http://localhost:3001/health

# Organization count
curl http://localhost:3001/organizations/list | jq '. | length'

# Container status
docker-compose ps
```

### Resource Usage
```bash
# CPU/Memory per container
docker stats

# Disk usage
df -h
du -sh data/*
```

## Backups

### Automated Daily Backup

Add to crontab:
```bash
crontab -e

# Add this line (runs at 2 AM daily):
0 2 * * * cp /path/to/donationtab/data/database/donations.db /path/to/donationtab/data/database/backups/donations-$(date +\%Y\%m\%d).db
```

Create backup directory:
```bash
mkdir -p data/database/backups
```

### Manual Backup
```bash
# Backup database
cp data/database/donations.db data/database/donations-backup-$(date +%Y%m%d).db

# Backup entire data directory
tar -czf donationtab-backup-$(date +%Y%m%d).tar.gz data/
```

### Restore from Backup
```bash
# Stop services
docker-compose stop

# Restore database
cp data/database/backups/donations-20250114.db data/database/donations.db

# Start services
docker-compose start
```

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Email Not Sending
```bash
# Test email config
docker-compose exec backend node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
transport.verify().then(console.log).catch(console.error);
"
```

### Can't Connect from App
```bash
# Check firewall
sudo ufw status

# Test from another machine
curl http://YOUR_SERVER_IP:3001/health

# Check nginx logs
docker-compose logs nginx
```

### Database Locked
```bash
docker-compose stop
rm data/database/donations.db-shm
rm data/database/donations.db-wal
docker-compose start
```

## Security

### Change Admin Passwords
Each organization admin should change their password regularly via the admin panel.

### Update System
```bash
# Monthly security updates
sudo apt update && sudo apt upgrade -y
docker-compose pull
docker-compose up -d
```

### Rate Limiting
Already configured in nginx.conf:
- API: 10 requests/second
- Registration: 1 request/minute

### Firewall Rules
```bash
sudo ufw status verbose
```

Should show:
- 22/tcp (SSH) - ALLOW
- 80/tcp (HTTP) - ALLOW
- 443/tcp (HTTPS) - ALLOW

## Performance Tips

### For ARM Servers

1. **Use Docker log rotation** (already configured)
2. **Monitor disk space:**
   ```bash
   # Clean old Docker images weekly
   docker system prune -a -f
   ```
3. **Optimize SQLite:**
   ```bash
   sqlite3 data/database/donations.db "VACUUM;"
   ```

### Scaling

- Current setup handles ~100 concurrent users
- For more, consider:
  - Moving to PostgreSQL
  - Using Redis for caching
  - Load balancer with multiple backends

## Cost Estimate

**ARM Server (e.g., Oracle Cloud Free Tier):**
- 4 ARM cores
- 24GB RAM
- Free forever

**Domain + SSL:**
- Domain: ~$10/year
- SSL: Free (Let's Encrypt)

**Total: ~$10/year or FREE with existing server!**

## Next Steps

1. ✅ Server running? Good!
2. ✅ Organization registered? Great!
3. □ Configure Stripe keys in admin panel
4. □ Build Android APK for your organization
5. □ Test donation flow end-to-end
6. □ Set up monitoring and backups
7. □ Invite more organizations!

## Support

- **Documentation:** See README.md and ARM_UBUNTU_DEPLOYMENT.md
- **Logs:** `docker-compose logs -f backend`
- **Issues:** Create GitHub issue
- **Community:** Discord/Slack (link here)

## License

MIT - Use for commercial purposes freely!

---

**Questions?** Open an issue on GitHub or check the full documentation.

**Working?** ⭐ Star the repo and share with others!
