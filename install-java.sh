#!/bin/bash

# Install Java JDK for Android builds
# Run this if you get "keytool: command not found"

set -e

echo "=================================="
echo "Java JDK Installation for Android"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if already installed
if command -v java >/dev/null 2>&1 && command -v keytool >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Java and keytool are already installed!${NC}"
  echo ""
  java -version
  echo ""
  echo "You can proceed with building the APK."
  exit 0
fi

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  echo -e "${RED}Cannot detect OS${NC}"
  exit 1
fi

echo "Detected OS: $OS"
echo ""

# Install based on OS
case $OS in
  ubuntu|debian)
    echo "Installing OpenJDK 11 on Ubuntu/Debian..."
    echo ""

    sudo apt update
    sudo apt install -y openjdk-11-jdk

    echo ""
    echo -e "${GREEN}✓ Java JDK installed${NC}"
    ;;

  centos|rhel|fedora)
    echo "Installing OpenJDK 11 on CentOS/RHEL/Fedora..."
    echo ""

    sudo yum install -y java-11-openjdk-devel

    echo ""
    echo -e "${GREEN}✓ Java JDK installed${NC}"
    ;;

  *)
    echo -e "${YELLOW}Unsupported OS: $OS${NC}"
    echo ""
    echo "Please install Java JDK 11 manually:"
    echo "  https://www.oracle.com/java/technologies/downloads/"
    echo ""
    exit 1
    ;;
esac

# Verify installation
echo ""
echo "Verifying installation..."
echo ""

if command -v java >/dev/null 2>&1; then
  echo -e "${GREEN}✓ java:${NC}"
  java -version
else
  echo -e "${RED}✗ java not found${NC}"
fi

echo ""

if command -v javac >/dev/null 2>&1; then
  echo -e "${GREEN}✓ javac:${NC}"
  javac -version
else
  echo -e "${RED}✗ javac not found${NC}"
fi

echo ""

if command -v keytool >/dev/null 2>&1; then
  echo -e "${GREEN}✓ keytool: installed${NC}"
else
  echo -e "${RED}✗ keytool not found${NC}"
fi

echo ""

# Set JAVA_HOME if not set
if [ -z "$JAVA_HOME" ]; then
  echo "Setting JAVA_HOME..."

  # Find Java installation
  JAVA_PATH=$(update-alternatives --query java 2>/dev/null | grep 'Value:' | cut -d' ' -f2 | sed 's|/bin/java||')

  if [ -n "$JAVA_PATH" ]; then
    echo "export JAVA_HOME=$JAVA_PATH" >> ~/.bashrc
    echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc

    echo ""
    echo -e "${GREEN}✓ JAVA_HOME set to: $JAVA_PATH${NC}"
    echo ""
    echo "Please reload your shell:"
    echo "  source ~/.bashrc"
  fi
fi

echo ""
echo "=================================="
echo "Installation Complete!"
echo "=================================="
echo ""
echo "You can now build Android APKs with:"
echo "  ./build-and-install.sh"
echo ""
