# Getting the App on Your Android Tablet

This guide will walk you through building and installing the DonationTab app on your Android tablet.

## Quick Overview

There are two approaches:

1. **Development/Testing** - Install directly via USB for testing (5 minutes)
2. **Production** - Build a signed APK for distribution (15 minutes)

---

## Option 1: Development Install (Fastest - For Testing)

Perfect for trying it out before building a production APK.

### Prerequisites

**On Your Computer:**
- Node.js 18+ installed
- Android Studio installed
- USB cable

**On Your Tablet:**
- Enable Developer Mode
- Enable USB Debugging

### Step 1: Enable Developer Mode on Tablet

1. Go to **Settings** → **About Tablet**
2. Tap **Build Number** 7 times
3. You'll see "You are now a developer!"
4. Go back to **Settings** → **Developer Options**
5. Enable **USB Debugging**

### Step 2: Setup Development Environment

```bash
# Clone the repository (if you haven't already)
git clone <your-repo-url>
cd donationtab

# Install dependencies
npm install

# Install React Native CLI globally
npm install -g react-native-cli
```

### Step 3: Configure Your Organization

Create a `.env` file in the project root:

```bash
nano .env
```

Add your server and organization details:
```env
# Your server URL
API_URL=https://your-server.com/api

# Your organization slug (from registration)
ORGANIZATION_SLUG=my-organization

# Stripe Publishable Key (you'll add this later via admin panel)
STRIPE_PUBLISHABLE_KEY=
```

### Step 4: Connect Tablet and Install

```bash
# Connect tablet via USB

# Verify connection
adb devices
# Should show your device

# Start Metro bundler
npm start

# In another terminal, install on tablet
npm run android
```

The app will install and launch on your tablet automatically!

**First Time?** It may take 5-10 minutes to build.

---

## Option 2: Production APK (For Distribution)

Build a signed APK that you can install on any tablet without a computer connected.

### Step 1: Generate a Signing Key

```bash
# Navigate to Android app directory
cd android/app

# Generate keystore (do this once)
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be asked:
# - Keystore password (choose a strong password)
# - Your name, organization, etc.
# - Key password (can be same as keystore password)

# IMPORTANT: Save this keystore file and passwords securely!
```

### Step 2: Configure Signing

Create `android/gradle.properties` (if it doesn't exist):

```bash
cd ../..  # Back to project root
nano android/gradle.properties
```

Add these lines:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
MYAPP_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

### Step 3: Update Build Configuration

Edit `android/app/build.gradle`:

```bash
nano android/app/build.gradle
```

Add signing configuration (look for `android { ... signingConfigs`):

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Configure for Your Organization

Update `.env` with your production settings:

```env
API_URL=https://your-server.com/api
ORGANIZATION_SLUG=my-organization
```

### Step 5: Build the APK

```bash
# Clean previous builds
cd android
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Build takes 5-10 minutes
```

Your APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 6: Install on Tablet

**Method A: Via USB**
```bash
# Connect tablet via USB
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Method B: Via File Transfer**
1. Copy `app-release.apk` to your tablet (USB, email, cloud storage, etc.)
2. On tablet, go to **Settings** → **Security**
3. Enable **Install from Unknown Sources**
4. Open the APK file on your tablet
5. Tap **Install**

**Method C: Via Cloud**
```bash
# Upload to your server
scp android/app/build/outputs/apk/release/app-release.apk user@your-server.com:/var/www/html/

# Download on tablet:
# https://your-server.com/app-release.apk
```

---

## Troubleshooting

### "Command not found: adb"

**macOS:**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.zshrc
```

**Linux:**
```bash
# Add to ~/.bashrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.bashrc
```

**Windows:**
Add to System Environment Variables:
```
ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
PATH=%PATH%;%ANDROID_HOME%\platform-tools
```

### "No devices found"

```bash
# Check USB debugging is enabled on tablet
adb devices

# Try restarting adb
adb kill-server
adb start-server
adb devices

# On tablet, check for authorization prompt
```

### Build Errors

```bash
# Clear cache and rebuild
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
cd android
./gradlew assembleRelease
```

### App Crashes on Launch

Check that:
1. `.env` file has correct `API_URL`
2. Server is running and accessible
3. Organization slug is correct
4. Check logs: `adb logcat *:E`

---

## Building for Multiple Organizations

If you're hosting multiple organizations, you have options:

### Option 1: Separate APKs per Organization

Build a branded APK for each organization:

```bash
# For Organization A
echo "API_URL=https://your-server.com/api" > .env
echo "ORGANIZATION_SLUG=org-a" >> .env
cd android && ./gradlew assembleRelease
mv app/build/outputs/apk/release/app-release.apk ../org-a.apk

# For Organization B
cd ..
echo "API_URL=https://your-server.com/api" > .env
echo "ORGANIZATION_SLUG=org-b" >> .env
cd android && ./gradlew clean && ./gradlew assembleRelease
mv app/build/outputs/apk/release/app-release.apk ../org-b.apk
```

### Option 2: Single APK with Organization Selector

Users choose their organization on first launch. This requires updating the app to use the OrganizationSelectorScreen.

---

## Updating the App

When you make changes:

### Development Mode:
```bash
# App will hot-reload automatically
# Or shake device and tap "Reload"
```

### Production APK:
```bash
# Rebuild APK
cd android
./gradlew assembleRelease

# Reinstall on tablet
adb install -r android/app/build/outputs/apk/release/app-release.apk
# -r flag replaces existing app
```

---

## App Bundle (For Google Play Store)

If you want to publish to Google Play Store:

```bash
# Build App Bundle instead of APK
cd android
./gradlew bundleRelease

# Output:
# android/app/build/outputs/bundle/release/app-release.aab
```

Upload the `.aab` file to Google Play Console.

---

## Testing Checklist

Before distributing to users:

- [ ] App launches successfully
- [ ] Organization loads correctly
- [ ] Donation amounts display
- [ ] Can select custom amount
- [ ] Stripe Terminal connects
- [ ] Payment processes successfully
- [ ] Receipt info screen works
- [ ] Email receipt sends (check spam)
- [ ] Admin panel accessible
- [ ] Admin can update settings
- [ ] Logo displays (if configured)
- [ ] App doesn't crash on rotation

---

## Distribution

### For Your Organization
1. Build signed APK
2. Upload to your website
3. Share download link with staff
4. Provide installation instructions

### For Multiple Organizations
1. Build APK per organization
2. Send each org their specific APK
3. Or build one APK with org selector
4. Include setup instructions

### Via Google Play Store
1. Build App Bundle (.aab)
2. Create Google Play Developer account ($25 one-time)
3. Upload bundle
4. Add screenshots, description
5. Submit for review
6. Publish (takes 1-3 days)

---

## Common Issues

### "Parse Error" on Install
- Keystore signing might be incorrect
- Rebuild with correct signing config

### "App Not Installed"
- Uninstall old version first
- Check storage space on tablet
- Enable "Install from Unknown Sources"

### Can't Connect to Server
- Check `API_URL` in `.env`
- Verify server is accessible from tablet
- Check firewall allows connections
- Try: `ping your-server.com` from tablet browser

### Stripe Terminal Not Connecting
- Ensure Bluetooth is enabled
- Grant location permissions
- Check Stripe keys are configured
- Use simulated reader for testing first

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Run on connected tablet (development)
npm run android

# Build production APK
cd android && ./gradlew assembleRelease

# Install APK on tablet
adb install path/to/app-release.apk

# View device logs
adb logcat

# Check connected devices
adb devices

# Uninstall app
adb uninstall com.donationtab
```

---

## Next Steps

1. **Test locally first** - Use development install
2. **Configure organization** - Via admin panel
3. **Test end-to-end** - Complete donation flow
4. **Build production APK** - When ready
5. **Distribute** - To your tablets

Need help? Check the logs:
```bash
# On computer
adb logcat | grep -i "error\|exception"

# Or check server logs
docker-compose logs -f backend
```
