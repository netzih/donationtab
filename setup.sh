#!/bin/bash

# DonationTab Multi-Tenant Setup Script for ARM Ubuntu Server

set -e

echo "=================================="
echo "DonationTab Multi-Tenant Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${RED}Please do not run this script as root${NC}"
  exit 1
fi

# Check OS
if [ ! -f /etc/os-release ]; then
  echo -e "${RED}Cannot detect OS. This script is designed for Ubuntu.${NC}"
  exit 1
fi

. /etc/os-release
if [ "$ID" != "ubuntu" ]; then
  echo -e "${YELLOW}Warning: This script is designed for Ubuntu. Your OS: $ID${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo -e "${GREEN}✓ OS Check passed${NC}"
echo ""

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Install Docker if not present
if ! command_exists docker; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  echo -e "${GREEN}✓ Docker installed${NC}"
else
  echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Docker Compose if not present
if ! command_exists docker-compose; then
  echo "Installing Docker Compose..."
  sudo apt update
  sudo apt install -y docker-compose
  echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

echo ""

# Generate random JWT secret
echo "Generating secure JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)

# Create .env file
echo "Creating environment configuration..."
cat > .env << EOF
# Auto-generated on $(date)
JWT_SECRET=$JWT_SECRET
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASSWORD=
EOF

echo -e "${GREEN}✓ Environment file created${NC}"

# Create data directories
echo "Creating data directories..."
mkdir -p data/database
mkdir -p data/logs
mkdir -p data/nginx-cache
sudo chown -R $USER:$USER data/
chmod -R 755 data/
echo -e "${GREEN}✓ Data directories created${NC}"

echo ""
echo "=================================="
echo "Configuration Required"
echo "=================================="
echo ""
echo "Please configure your email settings in the .env file:"
echo "  nano .env"
echo ""
echo "Required email settings:"
echo "  - EMAIL_USER (your email address)"
echo "  - EMAIL_PASSWORD (app-specific password)"
echo ""
echo "For Gmail:"
echo "  1. Enable 2-Factor Authentication"
echo "  2. Generate App Password at: https://myaccount.google.com/apppasswords"
echo "  3. Use the generated password in EMAIL_PASSWORD"
echo ""

read -p "Have you configured email settings? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Please configure email and re-run: ./setup.sh --skip-install"
  exit 0
fi

echo ""
echo "=================================="
echo "SSL Certificate Setup"
echo "=================================="
echo ""
echo "Do you want to set up SSL with Let's Encrypt?"
echo "(Requires a domain name pointed to this server)"
read -p "Setup SSL now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN

  if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain name required${NC}"
    exit 1
  fi

  echo "Installing Certbot..."
  sudo apt update
  sudo apt install -y certbot

  echo "Obtaining SSL certificate..."
  sudo certbot certonly --standalone -d $DOMAIN

  echo "Copying certificates..."
  mkdir -p ssl
  sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
  sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
  sudo chown -R $USER:$USER ssl/

  echo -e "${GREEN}✓ SSL certificate configured${NC}"
else
  echo "Creating self-signed certificate for testing..."
  mkdir -p ssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
  echo -e "${GREEN}✓ Self-signed certificate created${NC}"
fi

echo ""
echo "=================================="
echo "Firewall Configuration"
echo "=================================="
echo ""

if command_exists ufw; then
  echo "Configuring firewall..."

  # Check if UFW is active
  if sudo ufw status | grep -q "Status: active"; then
    echo "UFW is already active"
  else
    echo "Enabling UFW..."
    # Allow SSH first!
    sudo ufw allow 22/tcp
    sudo ufw --force enable
  fi

  # Allow HTTP and HTTPS
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp

  echo -e "${GREEN}✓ Firewall configured${NC}"
  echo ""
  sudo ufw status
else
  echo "UFW not installed. Installing..."
  sudo apt update
  sudo apt install -y ufw
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw --force enable
  echo -e "${GREEN}✓ Firewall configured${NC}"
fi

echo ""
echo "=================================="
echo "Building and Starting Services"
echo "=================================="
echo ""

# Build Docker image
echo "Building Docker image..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for services to start..."
sleep 5

# Check health
echo "Checking service health..."
if curl -f -s http://localhost:3001/health > /dev/null; then
  echo -e "${GREEN}✓ Service is healthy${NC}"
else
  echo -e "${RED}✗ Service health check failed${NC}"
  echo "Check logs with: docker-compose logs backend"
fi

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo -e "${GREEN}✓ DonationTab is now running!${NC}"
echo ""
echo "API URL: http://localhost:3001"
echo "Health Check: curl http://localhost:3001/health"
echo ""
echo "Next Steps:"
echo ""
echo "1. Register your first organization:"
echo "   curl -X POST http://localhost:3001/organizations/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"name\":\"My Organization\",\"email\":\"admin@example.com\",\"password\":\"SecurePass123!\"}'"
echo ""
echo "2. View logs:"
echo "   docker-compose logs -f backend"
echo ""
echo "3. Stop services:"
echo "   docker-compose stop"
echo ""
echo "4. Restart services:"
echo "   docker-compose restart"
echo ""
echo "5. View database:"
echo "   sqlite3 data/database/donations.db"
echo ""
echo "For detailed documentation, see:"
echo "  - ARM_UBUNTU_DEPLOYMENT.md"
echo "  - README.md"
echo ""
echo -e "${YELLOW}Important: If this is a fresh install, you may need to log out and back in for Docker group permissions to take effect.${NC}"
echo ""
