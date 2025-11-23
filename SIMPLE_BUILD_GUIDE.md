# Simple Android APK Build Guide

Quick guide to build the Android APK for your tablet.

## 📋 Prerequisites

You need:
- ✅ Node.js 18+ (we detected your Node.js 23)
- ✅ Java JDK 11+ (for keytool and Android builds)
- ✅ Your server URL and organization slug

## 🚀 Quick Start (First Time)

### Step 1: Install Java

```bash
./install-java.sh
```

Or manually:
```bash
sudo apt update
sudo apt install openjdk-11-jdk
```

### Step 2: Initialize the Project

```bash
./init-project.sh
```

This creates the Android project structure (only needs to be done once).

### Step 3: Configure Your Organization

Create a `.env` file:
```bash
nano .env
```

Add:
```env
API_URL=https://your-server.com/api
ORGANIZATION_SLUG=my-organization
```

Replace with your actual server URL and organization slug from registration.

### Step 4: Build the APK

```bash
./build-and-install.sh
```

Choose option **2** for Production APK.

The script will:
1. Check all prerequisites
2. Install dependencies
3. Generate signing key (first time only)
4. Build the APK

---

## 📦 Where is the APK?

After building, your APK will be at:

```
android/app/build/outputs/apk/release/app-release.apk
```

**File size:** Usually 30-50 MB

---

## 📲 Install on Your Tablet

### Option 1: Direct File Transfer

1. **Copy APK to tablet:**
   ```bash
   # Via SCP to another location
   scp android/app/build/outputs/apk/release/app-release.apk user@tablet-ip:/sdcard/

   # Or upload to your server
   cp android/app/build/outputs/apk/release/app-release.apk /var/www/html/app.apk
   ```

2. **On tablet:**
   - Open browser, download the APK
   - Or transfer via USB cable
   - Enable "Install from Unknown Sources" in Settings
   - Tap the APK file
   - Tap "Install"

### Option 2: Via Email

```bash
# Email to yourself
echo "APK attached" | mail -s "DonationTab APK" -A android/app/build/outputs/apk/release/app-release.apk your-email@example.com
```

Download on tablet and install.

### Option 3: Via Cloud Storage

Upload to Dropbox, Google Drive, etc. and download on tablet.

### Option 4: Via USB (if adb installed)

```bash
# Connect tablet via USB
adb devices

# Install
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔄 Rebuilding (Updates)

When you make changes:

```bash
./build-and-install.sh
```

Choose option 2 again. The APK will be rebuilt.

To update on tablet:
- Install the new APK (it will update the existing app)

---

## ✅ Complete Example

```bash
# 1. Install Java (first time only)
./install-java.sh

# 2. Initialize project (first time only)
./init-project.sh

# 3. Configure .env
cat > .env << EOF
API_URL=https://donations.myserver.com/api
ORGANIZATION_SLUG=my-charity
EOF

# 4. Build APK
./build-and-install.sh
# Choose option 2

# 5. Find your APK
ls -lh android/app/build/outputs/apk/release/app-release.apk

# 6. Copy to accessible location
cp android/app/build/outputs/apk/release/app-release.apk ~/app-release.apk

# 7. Download to tablet and install
```

---

## 🎯 APK Location Quick Reference

**Full path:**
```
/path/to/donationtab/android/app/build/outputs/apk/release/app-release.apk
```

**Quick copy to home directory:**
```bash
cp android/app/build/outputs/apk/release/app-release.apk ~/DonationTab.apk
```

**Quick copy to web root (to download via browser):**
```bash
sudo cp android/app/build/outputs/apk/release/app-release.apk /var/www/html/donationtab.apk
```

Then access via:
```
http://your-server-ip/donationtab.apk
```

---

## 🔍 Troubleshooting

### "gradlew: No such file or directory"
Run the initialization first:
```bash
./init-project.sh
```

### "keytool: command not found"
Install Java JDK:
```bash
./install-java.sh
```

### "Node.js not found"
The script auto-detects Plesk Node.js. If it still fails:
```bash
./detect-nodejs.sh
```

### Build fails with errors
```bash
# Clean and retry
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
./build-and-install.sh
```

### Can't find the APK
```bash
# Search for it
find . -name "app-release.apk"

# Should show:
# ./android/app/build/outputs/apk/release/app-release.apk
```

---

## 📝 Summary

**First time setup:**
1. `./install-java.sh` - Install Java
2. `./init-project.sh` - Initialize project
3. Create `.env` file
4. `./build-and-install.sh` - Build APK

**APK location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

**To install on tablet:**
- Transfer APK file
- Enable "Unknown Sources"
- Tap APK and install

That's it! 🎉
