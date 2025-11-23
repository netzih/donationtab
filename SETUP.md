# Quick Setup Guide

This guide will help you get DonationTab up and running quickly.

## Step 1: Install Prerequisites

### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Watchman
brew install watchman

# Install Java (for Android)
brew install --cask adoptopenjdk/openjdk/adoptopenjdk11
```

### Linux
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java
sudo apt-get install openjdk-11-jdk
```

### Windows
1. Install Node.js from https://nodejs.org
2. Install Android Studio from https://developer.android.com/studio
3. Install Java JDK 11

## Step 2: Install Android Studio

1. Download from https://developer.android.com/studio
2. Install Android SDK
3. Configure environment variables:

### macOS/Linux
Add to `~/.bash_profile` or `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Windows
Add to System Environment Variables:
```
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
```

## Step 3: Clone and Install

```bash
# Clone repository
git clone <your-repo-url>
cd donationtab

# Install app dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

## Step 4: Configure Stripe

1. **Create Stripe Account**
   - Go to https://stripe.com
   - Sign up for an account
   - Complete verification

2. **Enable Stripe Terminal**
   - Go to Stripe Dashboard
   - Navigate to Products → Terminal
   - Enable Terminal

3. **Get API Keys**
   - Go to Developers → API Keys
   - Copy Publishable Key (starts with `pk_test_`)
   - Copy Secret Key (starts with `sk_test_`)

4. **Register a Location**
   - Go to Terminal → Locations
   - Create a new location
   - Note the Location ID (starts with `tml_`)

5. **Register Your Reader** (if you have physical hardware)
   - Go to Terminal → Readers
   - Follow registration process
   - Or use simulated reader for testing

## Step 5: Configure Environment

### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ORG_NAME=Your Organization Name
ORG_EMAIL=donations@yourorg.com
ORG_TAX_ID=12-3456789
```

### App (.env)
```bash
cd ..
cp .env.example .env
```

Edit `.env`:
```env
API_URL=http://localhost:3001
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

## Step 6: Update Location ID

Edit `src/services/stripeService.ts` and replace:
```typescript
locationId: 'tml_simulated'
```
with your actual Location ID from Step 4.

## Step 7: Setup Email (Gmail Example)

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Turn on

2. **Generate App Password**
   - Security → App passwords
   - Select "Mail" and "Other"
   - Name it "DonationTab"
   - Copy the 16-character password

3. **Update .env**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=<16-character-app-password>
   ```

## Step 8: Start the Application

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 3001
Database initialized successfully
```

### Terminal 2: Metro (React Native)
```bash
# From project root
npm start
```

### Terminal 3: Android App
```bash
# From project root
npm run android
```

## Step 9: First Time Setup

1. **Wait for App to Load**
   - The app will build and install on your device/emulator
   - This may take several minutes on first run

2. **Grant Permissions**
   - Allow location permissions (required for Bluetooth)
   - Allow any other requested permissions

3. **Test Donor Flow**
   - Select a donation amount
   - Tap "Continue to Payment"
   - Use simulated reader or physical device

4. **Access Admin Panel**
   - Tap "Admin Access" at bottom
   - Enter password: `admin123`
   - Configure your settings

## Step 10: Production Configuration

### Change Admin Password
```bash
# Generate hash for new password
curl -X POST http://localhost:3001/admin/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"password": "your-secure-password"}'

# Copy the hash and add to backend/.env
ADMIN_PASSWORD_HASH=<hash-from-above>
```

### Use Production Stripe Keys
1. Go to Stripe Dashboard
2. Toggle to "Production" mode
3. Get production API keys
4. Update `.env` files

### Configure Organization Details
In Admin Panel:
1. Go to "Organization" tab
2. Fill in all details
3. Save

### Customize Email Template
1. Go to "Email" tab
2. Edit template
3. Use placeholders: `{name}`, `{amount}`, `{organization}`, `{taxId}`, `{date}`
4. Save

## Verification Checklist

- [ ] Backend server running on port 3001
- [ ] App launches successfully
- [ ] Can select donation amount
- [ ] Stripe Terminal connects (simulated or physical)
- [ ] Payment processes successfully
- [ ] Receipt email sends (check spam folder)
- [ ] Admin panel accessible
- [ ] All admin tabs functional

## Common Issues

### "Cannot connect to Metro"
- Ensure Metro bundler is running (`npm start`)
- Check firewall settings
- Try `adb reverse tcp:8081 tcp:8081`

### "Stripe Terminal connection failed"
- Check location permissions
- Verify API keys are correct
- Ensure reader is registered
- Try simulated mode first

### "Email not sending"
- Verify SMTP credentials
- Check App Password (not regular password)
- Look in spam folder
- Try sending test email via Nodemailer

### "Database error"
- Delete `backend/database/donations.db`
- Restart backend server
- Check file permissions

## Next Steps

- Test complete donation flow
- Configure donation amounts
- Upload organization logo
- Customize email template
- Test on physical Stripe Terminal
- Deploy backend to production
- Build release APK

## Getting Help

- Documentation: `README.md`
- Stripe Docs: https://stripe.com/docs/terminal
- React Native: https://reactnative.dev
- Issues: GitHub Issues page

## Development Tips

### Hot Reload
- Press `r` in Metro bundler to reload
- Shake device for dev menu
- Enable Fast Refresh for automatic reload

### Debugging
- Use Chrome DevTools
- Press `Ctrl+M` (Windows/Linux) or `Cmd+M` (macOS) for dev menu
- Select "Debug JS Remotely"

### Testing
```bash
# Run tests
npm test

# Run linter
npm run lint
```

### Building Release APK
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`
