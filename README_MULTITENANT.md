# DonationTab - Multi-Tenant Edition

🎉 **Host donation apps for unlimited organizations on a single server!**

A complete, production-ready donation platform with Stripe Tap-to-Pay for Android tablets. Each organization gets their own branded donation app with isolated data and settings.

## ✨ What's New in Multi-Tenant

- 🏢 **Unlimited Organizations** - Host as many organizations as you want
- 🔒 **Complete Isolation** - Each org has separate Stripe keys, data, and settings
- 🎨 **Custom Branding** - Per-organization logos, colors, and email templates
- 📱 **One Codebase** - Deploy once, serve many
- 💰 **Cost Effective** - Run on a single ARM server (even free tier!)
- 🚀 **Easy Setup** - Automated installation script
- 🐳 **Docker Ready** - Simple deployment with Docker Compose

## 🎯 Perfect For

- **Payment Processors** - Serve multiple clients from one platform
- **Franchises** - Each location has their own donation settings
- **Non-Profit Networks** - Umbrella organizations serving multiple causes
- **Event Organizers** - Different events, different Stripe accounts
- **SaaS Providers** - Offer donation services to customers

## 🚀 Quick Start (10 Minutes)

### 1. Setup Server
```bash
git clone https://github.com/yourorg/donationtab.git
cd donationtab
./setup.sh
```

### 2. Configure Email
```bash
nano .env
# Add your EMAIL_USER and EMAIL_PASSWORD
docker-compose restart backend
```

### 3. Register Organization
```bash
curl -X POST http://localhost:3001/organizations/register \
  -H "Content-Type: application/json" \
  -d '{"name":"My Org","email":"admin@myorg.com","password":"SecurePass123!"}'
```

### 4. Done! 🎉
Your multi-tenant donation server is running!

📖 **Detailed Guide:** See [MULTI_TENANT_QUICKSTART.md](MULTI_TENANT_QUICKSTART.md)

## 🏗️ Architecture

```
Single Server (ARM Ubuntu)
├── Nginx (SSL, Rate Limiting)
├── Node.js Backend (Multi-Tenant)
├── SQLite Database (Per-Org Isolation)
└── Docker Compose (Easy Management)

Multiple Organizations
├── Org A (slug: org-a)
│   ├── Stripe Keys
│   ├── Donation Amounts
│   ├── Branding
│   └── Donation Records
├── Org B (slug: org-b)
│   ├── Stripe Keys (different)
│   ├── Donation Amounts
│   ├── Branding
│   └── Donation Records
└── ...
```

## 📱 Mobile App Features

Each organization gets:

**Donor Experience:**
- Custom branded interface
- Preset + custom donation amounts
- Stripe Terminal tap-to-pay
- Optional email receipts
- Thank you screen

**Admin Panel:**
- Stripe API configuration
- Donation amount management
- Logo upload
- Email template customization
- Organization info editor
- Donation history

## 🔧 Tech Stack

**Backend:**
- Node.js + Express
- SQLite (multi-tenant schema)
- Stripe Terminal API
- Nodemailer
- JWT authentication
- Docker + Docker Compose

**Frontend (React Native):**
- TypeScript
- React Navigation
- React Native Paper (Material Design)
- Stripe React Native SDK
- AsyncStorage

**Infrastructure:**
- Nginx (reverse proxy, SSL, rate limiting)
- Docker (ARM + x86_64 support)
- Let's Encrypt (free SSL)
- Ubuntu 20.04+ (ARM or x86)

## 📊 Database Schema

### Organizations Table
Each organization is completely isolated:
- Unique slug (URL identifier)
- Stripe keys (publishable, secret, location ID)
- Admin password (hashed)
- Branding (logo, colors)
- Email template
- Settings (custom amounts, etc.)

### Donations Table
Per-organization donation records:
- Organization ID (foreign key)
- Amount, currency
- Donor info (optional)
- Stripe payment intent ID
- Receipt status
- Timestamp

### Donation Amounts Table
Per-organization preset amounts:
- Organization ID
- Amount and label
- Sort order
- Active status

## 🌐 API Endpoints

### Public Endpoints
- `GET /organizations/list` - List all organizations
- `GET /organizations/slug/:slug` - Get organization details
- `POST /organizations/register` - Register new organization
- `GET /health` - Health check

### Organization-Specific
- `POST /admin/login/:orgSlug` - Admin login
- `POST /stripe/connection-token/:orgId` - Stripe Terminal token
- `POST /stripe/payment-intent/:orgId` - Create payment
- `POST /donations/:orgId` - Save donation
- `GET /donations/:orgId` - List donations
- `POST /receipts/send` - Send email receipt

## 🔒 Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Rate limiting (Nginx)
- ✅ SSL/TLS (Let's Encrypt)
- ✅ Firewall (UFW)
- ✅ Organization isolation
- ✅ Input validation
- ✅ Secure headers

## 💾 Data Isolation

Each organization's data is completely separate:

**✅ Isolated:**
- Stripe API keys
- Donation records
- Donor information
- Email templates
- Admin passwords

**✅ Shared (server-level):**
- Email SMTP config (optional per-org override)
- Server resources
- SSL certificate

## 📦 Deployment Options

### ARM Ubuntu Server (Recommended)
```bash
./setup.sh
```

**Supports:**
- ARM64 (Apple Silicon, AWS Graviton, Oracle Cloud)
- x86_64 (Standard Intel/AMD)
- Ubuntu 20.04+
- Debian 11+

### Manual Docker
```bash
docker-compose build
docker-compose up -d
```

### VPS Providers
- **Free:** Oracle Cloud (ARM Free Tier)
- **Paid:** DigitalOcean, Linode, Vultr
- **Enterprise:** AWS, GCP, Azure

## 🎨 Customization Per Organization

Admins can configure:

1. **Stripe Settings**
   - Publishable Key
   - Secret Key
   - Terminal Location ID

2. **Donation Amounts**
   - Add/remove preset amounts
   - Enable/disable custom amounts
   - Reorder amounts

3. **Branding**
   - Upload logo
   - Organization name
   - Contact email
   - Physical address
   - Tax ID (EIN)

4. **Email Receipts**
   - Customize template
   - Use placeholders: `{name}`, `{amount}`, `{date}`, etc.
   - Configure SMTP (or use server default)

## 📊 Monitoring & Management

### View Logs
```bash
docker-compose logs -f backend
```

### Database Access
```bash
sqlite3 data/database/donations.db
```

### List Organizations
```bash
curl http://localhost:3001/organizations/list
```

### Service Health
```bash
curl http://localhost:3001/health
```

## 💰 Cost Breakdown

**Server Options:**

| Provider | Specs | Cost/Month |
|----------|-------|------------|
| Oracle Cloud (ARM) | 4 cores, 24GB RAM | **FREE** |
| DigitalOcean | 2 cores, 4GB RAM | $24 |
| Linode | 2 cores, 4GB RAM | $24 |
| AWS Lightsail | 2 cores, 4GB RAM | $24 |

**Additional Costs:**
- Domain name: ~$10/year
- SSL: FREE (Let's Encrypt)
- Email: FREE (Gmail) or $5/mo (SendGrid)

**Total: FREE to $30/month for unlimited organizations!**

## 🔄 Migration from Single-Tenant

Already using the single-tenant version?

1. **Backup your data**
2. **Run migration script** (coming soon)
3. **Update API calls** to include organization ID
4. **Rebuild mobile app** with organization selector

## 📖 Documentation

- **Quick Start:** [MULTI_TENANT_QUICKSTART.md](MULTI_TENANT_QUICKSTART.md)
- **Deployment:** [ARM_UBUNTU_DEPLOYMENT.md](ARM_UBUNTU_DEPLOYMENT.md)
- **Original Docs:** [README.md](README.md)
- **Setup Guide:** [SETUP.md](SETUP.md)
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - Use commercially, modify freely, no attribution required.

See [LICENSE](LICENSE) for details.

## 🆘 Support

- **Documentation:** Check the guides above
- **Issues:** [GitHub Issues](https://github.com/yourorg/donationtab/issues)
- **Email:** support@yourdomain.com
- **Discord:** (link here)

## 🎯 Roadmap

- [ ] PostgreSQL support
- [ ] Redis caching
- [ ] Web admin dashboard
- [ ] Usage analytics per org
- [ ] Webhook support
- [ ] Recurring donations
- [ ] QR code generation
- [ ] Mobile app white-labeling
- [ ] iOS version

## ⭐ Show Your Support

If this project helped you, please:
- ⭐ Star this repo
- 🐦 Tweet about it
- 📝 Write a blog post
- 💬 Spread the word

## 🙏 Acknowledgments

- Stripe for amazing payment infrastructure
- React Native community
- Docker for making deployment simple
- All our contributors

---

**Made with ❤️ for non-profits and organizations worldwide**

[Get Started Now](MULTI_TENANT_QUICKSTART.md) | [Report Bug](https://github.com/yourorg/donationtab/issues) | [Request Feature](https://github.com/yourorg/donationtab/issues)
