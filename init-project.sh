#!/bin/bash

# Initialize React Native Android Project
# Run this once before building

set -e

echo "=================================="
echo "Initialize React Native Project"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detect Node.js (same as build script)
if [ -d "/opt/plesk/node" ]; then
  for NODE_DIR in /opt/plesk/node/*/bin; do
    if [ -d "$NODE_DIR" ] && [ -f "$NODE_DIR/node" ]; then
      export PATH="$NODE_DIR:$PATH"
      break
    fi
  done
fi

# Check for npx
if ! command -v npx >/dev/null 2>&1; then
  echo -e "${RED}npx not found. Installing...${NC}"
  npm install -g npx
fi

echo "This will initialize the React Native Android project."
echo "This only needs to be done once."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 0
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Initializing Android project..."
echo ""

# Create android directory if it doesn't exist
if [ ! -d "android" ]; then
  mkdir -p android
fi

# Generate React Native Android project
npx react-native init DonationTabTemp --skip-install

# Copy Android files from temp project
if [ -d "DonationTabTemp/android" ]; then
  echo "Copying Android project files..."

  # Copy gradle wrapper
  cp -r DonationTabTemp/android/gradle android/
  cp DonationTabTemp/android/gradlew android/
  cp DonationTabTemp/android/gradlew.bat android/

  # Make gradlew executable
  chmod +x android/gradlew

  # Clean up temp project
  rm -rf DonationTabTemp

  echo -e "${GREEN}✓ Android project initialized${NC}"
else
  echo -e "${RED}Failed to initialize Android project${NC}"
  exit 1
fi

echo ""
echo "=================================="
echo "Initialization Complete!"
echo "=================================="
echo ""
echo "You can now build the APK with:"
echo "  ./build-and-install.sh"
echo ""
