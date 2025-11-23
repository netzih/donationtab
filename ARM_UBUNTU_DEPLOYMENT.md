# ARM Ubuntu Server Deployment Guide

This guide will help you deploy DonationTab on an ARM-based Ubuntu server using Docker.

## Prerequisites

- ARM-based Ubuntu server (20.04 or later)
- Root or sudo access
- Domain name (optional but recommended)
- At least 1GB RAM
- 10GB disk space

## Step 1: Initial Server Setup

### Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Start Docker on boot
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
```

### Install Docker Compose
```bash
# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker-compose --version
```

## Step 2: Clone the Repository

```bash
# Install git if not already installed
sudo apt install git -y

# Clone the repository
git clone https://github.com/yourorg/donationtab.git
cd donationtab
```

## Step 3: Configure Environment

### Create Environment File
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

### Edit Backend Environment Variables
```env
NODE_ENV=production
PORT=3001

# JWT Secret (generate a random string)
JWT_SECRET=$(openssl rand -base64 32)

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Database
DB_PATH=/app/backend/database/donations.db
```

### Create Docker Environment File
```bash
nano .env
```

Add:
```env
JWT_SECRET=your-very-secure-random-secret-min-32-chars
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Step 4: Create Data Directories

```bash
# Create directories for persistent data
mkdir -p data/database
mkdir -p data/logs
mkdir -p data/nginx-cache

# Set permissions
sudo chown -R $USER:$USER data/
chmod -R 755 data/
```

## Step 5: SSL Certificate Setup (Recommended)

### Option 1: Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot -y

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d api.yourdomain.com

# Copy certificates
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/

# Set up auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Self-Signed Certificate (Development)

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Step 6: Build and Start Services

```bash
# Build the Docker image
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

## Step 7: Configure Firewall

```bash
# Install UFW if not installed
sudo apt install ufw -y

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 8: Verify Installation

### Check Health Endpoint
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-14T..."}
```

### Check from External
```bash
curl https://yourdomain.com/api/health
```

## Step 9: Register First Organization

### Via API
```bash
curl -X POST https://yourdomain.com/api/organizations/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Organization",
    "email": "admin@myorg.com",
    "password": "SecurePassword123!",
    "address": "123 Main St, City, State 12345",
    "taxId": "12-3456789"
  }'
```

Response will include:
```json
{
  "success": true,
  "organization": {
    "id": "uuid",
    "name": "My Organization",
    "slug": "my-organization"
  },
  "setupUrl": "/org/my-organization/setup"
}
```

## Step 10: Configure Your Organization

Each organization needs to configure:

1. **Stripe Keys** (via admin panel in the app)
   - Publishable Key
   - Secret Key
   - Location ID

2. **Email Settings** (optional, uses server default if not set)

3. **Donation Amounts**

4. **Logo and Branding**

## Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Stop Services
```bash
docker-compose stop
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup Database
```bash
# Create backup
cp data/database/donations.db data/database/donations-$(date +%Y%m%d).db

# Automated daily backup (crontab)
crontab -e

# Add this line:
0 2 * * * cp /path/to/donationtab/data/database/donations.db /path/to/donationtab/data/database/donations-$(date +\%Y\%m\%d).db
```

### View Database
```bash
# Install sqlite3
sudo apt install sqlite3 -y

# Open database
sqlite3 data/database/donations.db

# Useful queries:
sqlite> .tables
sqlite> SELECT * FROM organizations;
sqlite> SELECT COUNT(*) FROM donations;
sqlite> .quit
```

## Performance Tuning for ARM

### Optimize Docker
```bash
# Edit Docker daemon config
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
docker-compose up -d
```

### Monitor Resources
```bash
# Install htop
sudo apt install htop -y

# Monitor system resources
htop

# Monitor Docker containers
docker stats
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
sudo lsof -i :3001

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Locked Error
```bash
# Stop all services
docker-compose stop

# Remove lock file
rm data/database/donations.db-shm
rm data/database/donations.db-wal

# Restart
docker-compose up -d
```

### Permission Issues
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER data/
chmod -R 755 data/
```

### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/fullchain.pem -text -noout

# Renew Let's Encrypt
sudo certbot renew --force-renewal
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem ssl/
docker-compose restart nginx
```

## Security Best Practices

1. **Change default passwords** immediately
2. **Use strong JWT_SECRET** (min 32 characters)
3. **Enable firewall** (UFW)
4. **Use SSL/TLS** (Let's Encrypt)
5. **Regular updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
6. **Backup regularly** (automated daily backups)
7. **Monitor logs** for suspicious activity
8. **Rate limiting** (already configured in nginx)

## Maintenance Schedule

### Daily
- Automated database backup (via cron)

### Weekly
```bash
# Check logs for errors
docker-compose logs --tail=500 backend | grep -i error

# Check disk space
df -h

# Check container health
docker-compose ps
```

### Monthly
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Clean old Docker images
docker system prune -a
```

### Certificate Renewal (Every 90 days for Let's Encrypt)
```bash
# Renew certificates
sudo certbot renew

# Copy to project
sudo cp /etc/letsencrypt/live/api.yourdomain.com/*.pem ssl/

# Restart nginx
docker-compose restart nginx
```

## Multi-Organization Access

### Users Access Their Organization
Each organization gets a unique URL slug:
```
https://yourdomain.com/org/my-organization
```

### In the React Native App
Organizations are selected by their slug when launching the app. You can either:

1. **Build separate APKs** per organization with hardcoded slug
2. **Use a single APK** with organization selector on first launch
3. **Use deep links**: `donationtab://org/my-organization`

## Monitoring

### Set Up Health Monitoring

Create a simple monitoring script:
```bash
nano monitor.sh
```

```bash
#!/bin/bash
ENDPOINT="http://localhost:3001/health"
if curl -f -s "$ENDPOINT" > /dev/null; then
    echo "$(date): Service is healthy"
else
    echo "$(date): Service is DOWN! Restarting..."
    cd /path/to/donationtab
    docker-compose restart backend
fi
```

Make executable and add to cron:
```bash
chmod +x monitor.sh
crontab -e

# Check every 5 minutes
*/5 * * * * /path/to/donationtab/monitor.sh >> /path/to/donationtab/data/logs/monitor.log 2>&1
```

## Getting Help

- Check logs: `docker-compose logs -f`
- Check health: `curl http://localhost:3001/health`
- Database issues: Check `data/logs/`
- GitHub Issues: Report problems

## Next Steps

1. Register organizations via API
2. Configure each organization's Stripe keys in their admin panel
3. Build and distribute Android APK to organization admins
4. Monitor and maintain the server

Your DonationTab server is now running and ready to serve multiple organizations!
