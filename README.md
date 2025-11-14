# DonationTab - Android Tablet Donation App

A modern, tablet-optimized donation app for Android that supports Stripe tap-to-pay terminal integration. Perfect for organizations that want to accept donations at events, offices, or any physical location.

## Features

### Donor Experience
- **Clean, Modern UI**: Optimized for tablet and mobile devices
- **Flexible Donation Amounts**: Pre-configured amounts plus custom amount option
- **Tap-to-Pay**: Seamless Stripe Terminal integration for contactless payments
- **Optional Receipts**: Donors can choose to receive email receipts for tax purposes
- **Quick Checkout**: Streamlined flow from amount selection to payment confirmation

### Admin Panel
- **Stripe Configuration**: Easy setup of Stripe API keys
- **Amount Management**: Configure donation amount options
- **Custom Amounts**: Toggle custom amount input on/off
- **Organization Branding**: Upload logo and set organization details
- **Receipt Customization**: Edit email receipt template with dynamic placeholders
- **Secure Access**: Password-protected admin dashboard

### Technical Features
- React Native for cross-platform compatibility
- Stripe Terminal SDK for reliable payment processing
- Node.js/Express backend API
- SQLite database for donation records
- Email receipts via Nodemailer
- Material Design UI with React Native Paper

## Architecture

```
donationtab/
├── src/                      # React Native app
│   ├── screens/              # App screens
│   │   ├── DonorHomeScreen.tsx
│   │   ├── PaymentScreen.tsx
│   │   ├── ReceiptInfoScreen.tsx
│   │   ├── ThankYouScreen.tsx
│   │   ├── AdminLoginScreen.tsx
│   │   └── AdminDashboardScreen.tsx
│   ├── services/             # Business logic
│   │   ├── configService.ts
│   │   ├── stripeService.ts
│   │   └── apiService.ts
│   ├── types/                # TypeScript types
│   └── App.tsx               # Main app component
│
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   │   ├── stripe.js
│   │   │   ├── donations.js
│   │   │   ├── receipts.js
│   │   │   └── admin.js
│   │   ├── services/         # Business logic
│   │   │   └── emailService.js
│   │   ├── database/         # Database setup
│   │   │   └── db.js
│   │   └── server.js         # Express app
│   └── database/             # SQLite database files
│
└── android/                  # Android-specific files
```

## Prerequisites

- Node.js 18+ and npm
- React Native development environment
- Android Studio and Android SDK
- Stripe account with Terminal enabled
- Stripe Terminal reader (physical device)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd donationtab
```

### 2. Install Dependencies

```bash
# Install React Native dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

#### Backend Configuration
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:
- **Stripe Keys**: Add your Stripe Secret Key
- **Email Settings**: Configure SMTP settings (Gmail, SendGrid, etc.)
- **Organization Info**: Set your organization details

#### App Configuration
```bash
cp .env.example .env
```

Edit `.env`:
- **API_URL**: Your backend API URL
- **Stripe Keys**: Add your Stripe Publishable Key

### 4. Initialize the Database

The database will be automatically created when you first start the backend server.

## Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3001`

### Start the React Native App

#### Terminal 1 - Metro Bundler
```bash
npm start
```

#### Terminal 2 - Android App
```bash
npm run android
```

## Stripe Terminal Setup

### 1. Create a Stripe Account
- Sign up at https://stripe.com
- Enable Stripe Terminal in your dashboard

### 2. Get Your API Keys
- Go to Stripe Dashboard → Developers → API Keys
- Copy your Publishable and Secret keys
- Add them to your `.env` files

### 3. Register Your Terminal Reader
- Go to Stripe Dashboard → Terminal → Readers
- Register your physical reader
- Note the Location ID (you'll need this)

### 4. Update Location ID
In `src/services/stripeService.ts`, update the `locationId`:
```typescript
locationId: 'tml_YOUR_LOCATION_ID'
```

## Configuration

### Admin Access

**Default Password**: `admin123`

**Important**: Change this in production by:
1. Generate a password hash:
```bash
curl -X POST http://localhost:3001/admin/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"password": "your-new-password"}'
```
2. Add the hash to `backend/.env`:
```
ADMIN_PASSWORD_HASH=<generated-hash>
```

### Email Configuration

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASSWORD`

For other providers, adjust `EMAIL_HOST` and `EMAIL_PORT` accordingly.

### Donation Amounts

Configure preset amounts in the Admin Dashboard:
1. Open the app
2. Tap "Admin Access"
3. Login with admin password
4. Go to "Amounts" tab
5. Add/remove amounts as needed

### Email Template

Customize the receipt email template with these placeholders:
- `{name}` - Donor name
- `{amount}` - Donation amount
- `{organization}` - Organization name
- `{taxId}` - Tax ID
- `{date}` - Donation date

## API Endpoints

### Stripe
- `POST /stripe/connection-token` - Get Stripe Terminal connection token
- `POST /stripe/payment-intent` - Create payment intent
- `GET /stripe/payment-intent/:id` - Get payment intent status

### Donations
- `POST /donations` - Create donation record
- `GET /donations` - List donations
- `GET /donations/:id` - Get specific donation
- `GET /donations/stats/summary` - Get donation statistics

### Receipts
- `POST /receipts/send` - Send receipt email
- `POST /receipts/resend/:donationId` - Resend receipt

### Admin
- `POST /admin/login` - Admin login
- `GET /admin/verify` - Verify admin token

## Deployment

### Android APK Build

```bash
cd android
./gradlew assembleRelease
```

The APK will be in `android/app/build/outputs/apk/release/`

### Backend Deployment

Deploy to any Node.js hosting service:
- Heroku
- DigitalOcean
- AWS Elastic Beanstalk
- Render
- Railway

Remember to:
1. Set environment variables
2. Use a production database (PostgreSQL recommended)
3. Enable HTTPS
4. Configure CORS appropriately

## Troubleshooting

### Stripe Terminal Connection Issues
- Ensure Bluetooth is enabled
- Check location permissions
- Verify reader is powered on and nearby
- Confirm reader is registered in Stripe Dashboard

### Email Not Sending
- Verify SMTP credentials
- Check email provider allows SMTP access
- For Gmail, ensure App Password is used
- Check spam folder

### Database Errors
- Ensure `backend/database` directory exists
- Check file permissions
- Delete `donations.db` and restart to reinitialize

## Security Considerations

**Production Checklist**:
- [ ] Change default admin password
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS for API
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Use production Stripe keys
- [ ] Secure database with proper permissions
- [ ] Implement logging and monitoring
- [ ] Regular security updates

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/yourorg/donationtab/issues)
- Read the [Stripe Terminal Documentation](https://stripe.com/docs/terminal)
- Contact support at support@yourorg.com

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## Acknowledgments

- Stripe for payment processing
- React Native community
- Material Design team
