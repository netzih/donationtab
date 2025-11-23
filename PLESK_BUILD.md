# Building on Plesk Server

If you're building the Android app on a Plesk server, Node.js may be installed in non-standard locations.

## Quick Detection

Run the Node.js detector to find your installation:

```bash
./detect-nodejs.sh
```

This will:
- Find all Node.js installations on your server
- Show recommended paths
- Provide commands to add Node.js to your PATH

## Common Plesk Node.js Locations

Plesk typically installs Node.js in:

- `/opt/plesk/node/20/bin/node` (Node.js 20)
- `/opt/plesk/node/18/bin/node` (Node.js 18)
- `/opt/plesk/node/16/bin/node` (Node.js 16)

## Manual Path Setup

If the build script can't find Node.js, add it to your PATH:

```bash
# Find your Node.js installation
ls -la /opt/plesk/node/*/bin/node

# Add to PATH (replace 20 with your version)
export PATH="/opt/plesk/node/20/bin:$PATH"

# Verify it works
node --version
npm --version

# Now run the build script
./build-and-install.sh
```

## Permanent PATH Setup

To make it permanent, add to `~/.bashrc`:

```bash
# Add this line
echo 'export PATH="/opt/plesk/node/20/bin:$PATH"' >> ~/.bashrc

# Reload
source ~/.bashrc

# Test
node --version
```

## Install Node.js on Plesk

If Node.js isn't installed:

### Method 1: Via Plesk Panel (Recommended)

1. Log into Plesk admin panel
2. Go to **Extensions** → **Node.js**
3. Click **Install** for Node.js 18 or 20
4. Wait for installation to complete

### Method 2: Via Command Line

```bash
# Install Node.js 18 (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

## Updated Build Script

The `build-and-install.sh` script now automatically:
- ✅ Detects Plesk Node.js installations
- ✅ Checks `/opt/plesk/node/*/bin`
- ✅ Checks vhost paths in `/var/www/vhosts/*/bin`
- ✅ Checks nvm installations
- ✅ Adds detected paths to PATH
- ✅ Uses the correct Node.js/npm commands

## Troubleshooting

### "Node.js not found" even though it's installed

```bash
# Check where Node.js is installed
which node
ls -la /opt/plesk/node/*/bin/node

# If found, export the path
export PATH="/opt/plesk/node/20/bin:$PATH"

# Try again
./build-and-install.sh
```

### Using specific Node.js version

```bash
# Use Plesk's Node.js 20 explicitly
export PATH="/opt/plesk/node/20/bin:$PATH"

# Or use nvm
source ~/.nvm/nvm.sh
nvm use 18

# Then run build
./build-and-install.sh
```

### Permission Issues

```bash
# If you get permission errors
sudo chown -R $USER:$USER /path/to/donationtab
chmod +x build-and-install.sh
```

## Build via Direct Commands

If the script still has issues, you can build directly:

```bash
# Set Node.js path (replace with your actual path)
export PATH="/opt/plesk/node/20/bin:$PATH"

# Install dependencies
npm install

# Build APK
cd android
./gradlew assembleRelease
cd ..

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Java Requirement

Android builds also need Java 11+:

```bash
# Check Java
java -version

# Install if needed (Ubuntu/Debian)
sudo apt update
sudo apt install openjdk-11-jdk

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

## Environment Variables for Plesk

Create a `.env` file in your home directory:

```bash
nano ~/.build-env
```

Add:
```bash
export PATH="/opt/plesk/node/20/bin:$PATH"
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

Load before building:
```bash
source ~/.build-env
./build-and-install.sh
```

## Complete Example for Plesk

```bash
# 1. Detect Node.js
./detect-nodejs.sh

# 2. Set PATH based on output
export PATH="/opt/plesk/node/20/bin:$PATH"

# 3. Verify
node --version  # Should show v20.x.x or v18.x.x
npm --version   # Should show 9.x.x or 10.x.x

# 4. Build
./build-and-install.sh

# Choose option 2 for Production APK
```

## Still Having Issues?

Run the detector for detailed diagnostics:

```bash
./detect-nodejs.sh
```

The script will:
- Show all Node.js installations found
- Recommend the best version to use
- Provide exact commands to add to PATH
- Test if Node.js is working

Then follow the recommendations provided.
