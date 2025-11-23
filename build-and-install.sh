#!/bin/bash

# DonationTab - Quick Build and Install Script for Android Tablet

set -e

echo "=================================="
echo "DonationTab - Build & Install"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: Must be run from project root${NC}"
  exit 1
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
  echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js installed${NC}"

if ! command_exists npm; then
  echo -e "${RED}✗ npm not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm installed${NC}"

if ! command_exists adb; then
  echo -e "${YELLOW}⚠ adb not found. You'll need it to install on device${NC}"
  echo "  Install Android SDK Platform Tools"
fi

echo ""

# Check for .env file
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠ .env file not found${NC}"
  echo "Creating .env file..."

  read -p "Enter your server URL (e.g., https://myserver.com/api): " SERVER_URL
  read -p "Enter your organization slug (e.g., my-organization): " ORG_SLUG

  cat > .env << EOF
API_URL=$SERVER_URL
ORGANIZATION_SLUG=$ORG_SLUG
EOF

  echo -e "${GREEN}✓ .env file created${NC}"
fi

echo ""
echo "Build options:"
echo "1) Development build (install via USB, faster)"
echo "2) Production APK (can distribute to tablets)"
echo ""
read -p "Choose option (1 or 2): " BUILD_OPTION

if [ "$BUILD_OPTION" = "1" ]; then
  echo ""
  echo "=================================="
  echo "Development Build"
  echo "=================================="
  echo ""

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
  fi

  echo ""
  echo "Make sure your tablet is connected via USB with USB Debugging enabled"
  read -p "Press Enter to continue..."

  # Check if device is connected
  if command_exists adb; then
    DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
    if [ "$DEVICES" -eq 0 ]; then
      echo -e "${RED}✗ No devices found${NC}"
      echo "Make sure:"
      echo "  1. Tablet is connected via USB"
      echo "  2. USB Debugging is enabled"
      echo "  3. You've authorized this computer on the tablet"
      exit 1
    fi
    echo -e "${GREEN}✓ Device connected${NC}"
  fi

  echo ""
  echo "Building and installing app..."
  echo "This may take 5-10 minutes on first build..."
  echo ""

  # Start Metro in background
  npm start &
  METRO_PID=$!

  # Give Metro time to start
  sleep 5

  # Build and install
  npm run android

  echo ""
  echo -e "${GREEN}=================================="
  echo "✓ App installed successfully!"
  echo "==================================${NC}"
  echo ""
  echo "The app should now be running on your tablet"
  echo "To reload changes, shake the device and tap 'Reload'"
  echo ""
  echo "To stop Metro bundler:"
  echo "  kill $METRO_PID"

elif [ "$BUILD_OPTION" = "2" ]; then
  echo ""
  echo "=================================="
  echo "Production APK Build"
  echo "=================================="
  echo ""

  # Check if keystore exists
  if [ ! -f "android/app/my-release-key.keystore" ]; then
    echo -e "${YELLOW}⚠ Release keystore not found${NC}"
    echo "Generating signing key..."
    echo ""

    cd android/app
    keytool -genkeypair -v -storetype PKCS12 \
      -keystore my-release-key.keystore \
      -alias my-key-alias \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000

    cd ../..

    echo ""
    echo -e "${GREEN}✓ Keystore created${NC}"
    echo ""
    echo "IMPORTANT: Save the keystore password you just entered!"
    echo ""

    read -p "Enter the keystore password you just created: " STORE_PASS
    read -p "Enter the key password (can be same as keystore): " KEY_PASS

    # Update gradle.properties
    if ! grep -q "MYAPP_RELEASE_STORE_FILE" android/gradle.properties; then
      cat >> android/gradle.properties << EOF

# Release signing
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=$STORE_PASS
MYAPP_RELEASE_KEY_PASSWORD=$KEY_PASS
EOF
      echo -e "${GREEN}✓ Signing configuration added${NC}"
    fi
  fi

  # Install dependencies
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
  fi

  echo ""
  echo "Building production APK..."
  echo "This may take 5-10 minutes..."
  echo ""

  cd android
  ./gradlew clean
  ./gradlew assembleRelease
  cd ..

  APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

  if [ -f "$APK_PATH" ]; then
    echo ""
    echo -e "${GREEN}=================================="
    echo "✓ APK built successfully!"
    echo "==================================${NC}"
    echo ""
    echo "APK location:"
    echo "  $APK_PATH"
    echo ""
    echo "APK size: $(du -h $APK_PATH | cut -f1)"
    echo ""
    echo "To install on tablet:"
    echo "  1. Copy APK to tablet"
    echo "  2. Enable 'Install from Unknown Sources' in Settings"
    echo "  3. Open APK file and tap Install"
    echo ""
    echo "Or install via USB:"
    echo "  adb install $APK_PATH"
    echo ""

    # Offer to install via adb
    if command_exists adb; then
      read -p "Install on connected device now? (y/n) " INSTALL_NOW
      if [[ $INSTALL_NOW =~ ^[Yy]$ ]]; then
        echo "Installing..."
        adb install "$APK_PATH"
        echo -e "${GREEN}✓ Installed successfully!${NC}"
      fi
    fi
  else
    echo -e "${RED}✗ Build failed${NC}"
    echo "Check the error messages above"
    exit 1
  fi

else
  echo -e "${RED}Invalid option${NC}"
  exit 1
fi

echo ""
echo "Done!"
