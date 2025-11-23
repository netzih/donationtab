#!/bin/bash

# DonationTab - Quick Build and Install Script for Android Tablet
# Compatible with Plesk environments

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

# Detect and add Plesk Node.js paths
echo "Detecting Node.js installation..."

# First, try to auto-detect all Plesk Node.js versions
if [ -d "/opt/plesk/node" ]; then
  # Find all node versions, sort by version number (descending)
  for NODE_DIR in /opt/plesk/node/*/bin; do
    if [ -d "$NODE_DIR" ] && [ -f "$NODE_DIR/node" ]; then
      echo "Found Plesk Node.js at: $NODE_DIR"
      export PATH="$NODE_DIR:$PATH"
    fi
  done
fi

# Also check specific common paths (fallback)
PLESK_PATHS=(
  "/opt/plesk/node/23/bin"
  "/opt/plesk/node/22/bin"
  "/opt/plesk/node/21/bin"
  "/opt/plesk/node/20/bin"
  "/opt/plesk/node/19/bin"
  "/opt/plesk/node/18/bin"
  "/usr/local/psa/var/modules/pmmm/node_modules/.bin"
)

# Add specific Plesk paths to PATH if they exist
for PLESK_PATH in "${PLESK_PATHS[@]}"; do
  if [ -d "$PLESK_PATH" ]; then
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$PLESK_PATH:"* ]]; then
      export PATH="$PLESK_PATH:$PATH"
    fi
  fi
done

# Also check for user-specific installations in Plesk vhosts
if [ -d "/var/www/vhosts" ]; then
  for VHOST_PATH in /var/www/vhosts/*/bin; do
    if [ -d "$VHOST_PATH" ] && [ -f "$VHOST_PATH/node" ]; then
      echo "Found Node.js at: $VHOST_PATH"
      export PATH="$VHOST_PATH:$PATH"
      break
    fi
  done
fi

# Check for nvm installations
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  echo "Loading nvm..."
  source "$HOME/.nvm/nvm.sh"
  nvm use default 2>/dev/null || nvm use node 2>/dev/null || true
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to find Node.js
find_nodejs() {
  # Try common locations
  local node_locations=(
    "$(command -v node 2>/dev/null)"
    "/opt/plesk/node/23/bin/node"
    "/opt/plesk/node/22/bin/node"
    "/opt/plesk/node/21/bin/node"
    "/opt/plesk/node/20/bin/node"
    "/opt/plesk/node/18/bin/node"
    "/usr/local/bin/node"
    "/usr/bin/node"
    "$HOME/.nvm/versions/node/*/bin/node"
  )

  for node_path in "${node_locations[@]}"; do
    if [ -f "$node_path" ] && [ -x "$node_path" ]; then
      echo "$node_path"
      return 0
    fi
  done

  return 1
}

# Function to find npm
find_npm() {
  local npm_locations=(
    "$(command -v npm 2>/dev/null)"
    "/opt/plesk/node/23/bin/npm"
    "/opt/plesk/node/22/bin/npm"
    "/opt/plesk/node/21/bin/npm"
    "/opt/plesk/node/20/bin/npm"
    "/opt/plesk/node/18/bin/npm"
    "/usr/local/bin/npm"
    "/usr/bin/npm"
    "$HOME/.nvm/versions/node/*/bin/npm"
  )

  for npm_path in "${npm_locations[@]}"; do
    if [ -f "$npm_path" ] && [ -x "$npm_path" ]; then
      echo "$npm_path"
      return 0
    fi
  done

  return 1
}

# Check prerequisites
echo "Checking prerequisites..."

# Find Node.js
NODE_CMD=""
if command_exists node; then
  NODE_CMD="node"
else
  NODE_PATH=$(find_nodejs)
  if [ -n "$NODE_PATH" ]; then
    NODE_CMD="$NODE_PATH"
    export PATH="$(dirname $NODE_PATH):$PATH"
  fi
fi

if [ -z "$NODE_CMD" ]; then
  echo -e "${RED}✗ Node.js not found${NC}"
  echo ""
  echo "Searched in:"
  echo "  - /opt/plesk/node/*/bin/node (Plesk installations)"
  echo "  - /usr/local/bin/node"
  echo "  - /usr/bin/node"
  echo "  - \$HOME/.nvm/versions/node/*/bin/node"
  echo ""
  echo "Please install Node.js 18+ or ensure it's in your PATH"
  echo ""
  echo "For Plesk, install Node.js via:"
  echo "  Plesk > Extensions > Node.js"
  echo ""
  exit 1
fi

NODE_VERSION=$($NODE_CMD --version)
echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION at $(command -v $NODE_CMD)${NC}"

# Find npm
NPM_CMD=""
if command_exists npm; then
  NPM_CMD="npm"
else
  NPM_PATH=$(find_npm)
  if [ -n "$NPM_PATH" ]; then
    NPM_CMD="$NPM_PATH"
    export PATH="$(dirname $NPM_PATH):$PATH"
  fi
fi

if [ -z "$NPM_CMD" ]; then
  echo -e "${RED}✗ npm not found${NC}"
  echo "npm should be installed with Node.js"
  exit 1
fi

NPM_VERSION=$($NPM_CMD --version)
echo -e "${GREEN}✓ npm installed: v$NPM_VERSION${NC}"

# Check for Java (needed for Android builds)
JAVA_INSTALLED=false
if ! command_exists java; then
  echo -e "${YELLOW}⚠ Java not found. You'll need Java 11+ for Android builds${NC}"
  echo "  Install with: sudo apt install openjdk-11-jdk"
else
  JAVA_INSTALLED=true
  echo -e "${GREEN}✓ Java installed: $(java -version 2>&1 | head -n 1)${NC}"
fi

# Check for keytool (needed for signing APKs)
KEYTOOL_INSTALLED=false
if ! command_exists keytool; then
  echo -e "${YELLOW}⚠ keytool not found. You'll need it to sign APKs${NC}"
  echo "  Install with: sudo apt install openjdk-11-jdk"
else
  KEYTOOL_INSTALLED=true
  echo -e "${GREEN}✓ keytool installed${NC}"
fi

# Check for adb
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
    $NPM_CMD install
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
  $NPM_CMD start &
  METRO_PID=$!

  # Give Metro time to start
  sleep 5

  # Build and install
  $NPM_CMD run android

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

    # Check if keytool is available
    if [ "$KEYTOOL_INSTALLED" = false ]; then
      echo ""
      echo -e "${RED}ERROR: keytool is required to generate signing keys${NC}"
      echo ""
      echo "Please install Java JDK first:"
      echo ""
      echo "  Ubuntu/Debian:"
      echo "    sudo apt update"
      echo "    sudo apt install openjdk-11-jdk"
      echo ""
      echo "  CentOS/RHEL:"
      echo "    sudo yum install java-11-openjdk-devel"
      echo ""
      echo "  Plesk:"
      echo "    Install via Plesk Panel or use the commands above"
      echo ""
      echo "After installing Java, run this script again."
      echo ""
      exit 1
    fi

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
    $NPM_CMD install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
  fi

  echo ""
  echo "Building production APK..."
  echo "This may take 5-10 minutes..."
  echo ""

  # Check if gradlew exists
  if [ ! -f "android/gradlew" ]; then
    echo -e "${RED}Android project not initialized!${NC}"
    echo ""
    echo "Please run the initialization script first:"
    echo "  ./init-project.sh"
    echo ""
    echo "This only needs to be done once."
    exit 1
  fi

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
