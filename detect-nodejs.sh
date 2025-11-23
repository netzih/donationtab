#!/bin/bash

# Plesk Node.js Path Detector and Installer
# Run this if you're having trouble finding Node.js on Plesk

echo "=================================="
echo "Plesk Node.js Detector"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "Searching for Node.js installations..."
echo ""

# Check system Node.js
if command -v node >/dev/null 2>&1; then
  echo -e "${GREEN}✓ System Node.js found:${NC}"
  echo "  Path: $(command -v node)"
  echo "  Version: $(node --version)"
  echo ""
fi

# Check Plesk installations
echo "Checking Plesk paths..."
for version in 20 19 18 17 16 14; do
  if [ -f "/opt/plesk/node/$version/bin/node" ]; then
    echo -e "${GREEN}✓ Found Plesk Node.js $version:${NC}"
    echo "  Path: /opt/plesk/node/$version/bin/node"
    echo "  Version: $(/opt/plesk/node/$version/bin/node --version)"
    echo ""
  fi
done

# Check vhost paths
if [ -d "/var/www/vhosts" ]; then
  echo "Checking vhost paths..."
  for vhost in /var/www/vhosts/*/bin/node; do
    if [ -f "$vhost" ]; then
      echo -e "${GREEN}✓ Found Node.js in vhost:${NC}"
      echo "  Path: $vhost"
      echo "  Version: $($vhost --version)"
      echo ""
    fi
  done
fi

# Check nvm
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  echo -e "${GREEN}✓ Found nvm installation${NC}"
  source "$HOME/.nvm/nvm.sh"
  echo "  nvm versions installed:"
  nvm list
  echo ""
fi

echo "=================================="
echo "Recommendations"
echo "=================================="
echo ""

# Determine best path
BEST_NODE=""
if [ -f "/opt/plesk/node/20/bin/node" ]; then
  BEST_NODE="/opt/plesk/node/20/bin/node"
elif [ -f "/opt/plesk/node/18/bin/node" ]; then
  BEST_NODE="/opt/plesk/node/18/bin/node"
elif command -v node >/dev/null 2>&1; then
  BEST_NODE=$(command -v node)
fi

if [ -n "$BEST_NODE" ]; then
  echo -e "${GREEN}Recommended Node.js to use:${NC}"
  echo "  $BEST_NODE"
  echo ""
  echo "Add to your PATH by running:"
  echo ""
  echo "  export PATH=\"$(dirname $BEST_NODE):\$PATH\""
  echo ""
  echo "Or add to ~/.bashrc:"
  echo ""
  echo "  echo 'export PATH=\"$(dirname $BEST_NODE):\$PATH\"' >> ~/.bashrc"
  echo "  source ~/.bashrc"
  echo ""
else
  echo -e "${RED}No Node.js installation found!${NC}"
  echo ""
  echo "To install Node.js on Plesk:"
  echo "  1. Log into Plesk admin panel"
  echo "  2. Go to Extensions > Node.js"
  echo "  3. Install Node.js 18 or later"
  echo ""
  echo "Or install manually:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  echo ""
fi

echo "=================================="
echo "Test Node.js"
echo "=================================="
echo ""

if [ -n "$BEST_NODE" ]; then
  echo "Testing Node.js..."
  $BEST_NODE -e "console.log('Node.js is working!')"

  NPM_PATH="$(dirname $BEST_NODE)/npm"
  if [ -f "$NPM_PATH" ]; then
    echo "Testing npm..."
    $NPM_PATH --version
    echo ""
    echo -e "${GREEN}✓ All tools working!${NC}"
  fi
fi

echo ""
echo "Done!"
