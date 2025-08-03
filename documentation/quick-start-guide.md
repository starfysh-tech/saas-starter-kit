# SaaS Starter Kit - Quick Start Guide

## What You'll Build

By following this guide, you'll have a fully functional multi-tenant SaaS platform with:

- ✅ User authentication (email/password, OAuth, SSO)
- ✅ Team management with role-based permissions
- ✅ API endpoints for external integrations
- ✅ Webhook system for real-time notifications
- ✅ Billing integration with Stripe
- ✅ Enterprise SSO with SAML
- ✅ Audit logging and compliance features

**Time to complete**: 15-30 minutes

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and npm installed
- **PostgreSQL** database (local or cloud)
- **Git** for version control
- **Email service** (Gmail, SendGrid, etc.) for transactional emails
- **Stripe account** (optional, for billing features)

---

## Step 1: Clone and Setup

### 1.1 Clone the Repository

```bash
git clone https://github.com/your-org/saas-starter-kit.git
cd saas-starter-kit
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Required - Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/saas_starter_kit"

# Required - NextAuth Configuration
NEXTAUTH_URL="http://localhost:4002"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Required - Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# Optional - OAuth Providers
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Optional - Stripe Billing
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional - Security
RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"
```

---

## Step 2: Database Setup

### 2.1 Start Database (Docker Option)

If you don't have PostgreSQL installed, use Docker:

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with credentials:
- Username: `postgres`
- Password: `password`
- Database: `saas_starter_kit`

### 2.2 Initialize Database Schema

```bash
# Push schema to database
npx prisma db push

# Seed with initial data (optional)
npx prisma db seed
```

### 2.3 Verify Database Connection

```bash
# Open Prisma Studio to view data
npx prisma studio
```

Visit `http://localhost:5555` to see your database tables.

---

## Step 3: Start the Application

### 3.1 Development Server

```bash
npm run dev
```

The application starts on `http://localhost:4002`.

### 3.2 Verify Installation

Visit `http://localhost:4002` and you should see the landing page.

---

## Step 4: Create Your First Team

### 4.1 Register Account

1. Navigate to `http://localhost:4002/auth/join`
2. Fill out the registration form:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: Secure password (8+ characters)
   - **Team**: Your team name (becomes URL slug)
3. Click "Create Account"

### 4.2 Email Verification (if enabled)

- Check your email for verification link
- Click the link to verify your account
- Return to the application

### 4.3 Access Team Dashboard

After registration, you'll be redirected to your team dashboard at:
`http://localhost:4002/teams/{your-team-slug}/settings`

---

## Step 5: Explore Core Features

### 5.1 Team Members

Navigate to `http://localhost:4002/teams/{slug}/members`:

1. **Invite Members**: Click "Add Member"
2. **Choose Method**:
   - **Email Invitation**: Send to specific email
   - **Link Invitation**: Generate shareable link
3. **Assign Role**: Member, Admin, or Owner
4. **Send Invitation**

### 5.2 API Keys

Navigate to `http://localhost:4002/teams/{slug}/api-keys`:

1. **Create API Key**: Click "Create API Key"
2. **Name Your Key**: Give it a descriptive name
3. **Copy Key**: Save the key securely (shown only once)
4. **Test API**: Use the key to call API endpoints

### 5.3 Webhooks

Navigate to `http://localhost:4002/teams/{slug}/webhooks`:

1. **Add Webhook**: Click "Add Webhook"
2. **Configure Endpoint**:
   - **URL**: Your webhook endpoint URL
   - **Events**: Select events to listen for
3. **Test Webhook**: Verify events are delivered

---

## Step 6: Test API Integration

### 6.1 Get Team Information

Using your API key, test the API:

```bash
curl -X GET http://localhost:4002/api/teams/{your-team-slug} \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json"
```

### 6.2 List Team Members

```bash
curl -X GET http://localhost:4002/api/teams/{your-team-slug}/members \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json"
```

### 6.3 Create Webhook

```bash
curl -X POST http://localhost:4002/api/teams/{your-team-slug}/webhooks \
  -H "Authorization: Bearer {your-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://webhook.site/your-unique-url",
    "eventTypes": ["member.created", "member.removed"]
  }'
```

---

## Step 7: Optional Features Setup

### 7.1 Stripe Billing (Optional)

If you want to enable billing:

1. **Create Stripe Account**: Visit [stripe.com](https://stripe.com)
2. **Get API Keys**: Copy from Stripe Dashboard
3. **Add to Environment**:
   ```bash
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   ```
4. **Create Products**: Set up products in Stripe
5. **Test Billing**: Navigate to team billing page

### 7.2 OAuth Providers (Optional)

For GitHub OAuth:

1. **Create GitHub App**: Go to GitHub Settings > Developer settings
2. **OAuth Apps**: Create new OAuth app
3. **Set Callback URL**: `http://localhost:4002/api/auth/callback/github`
4. **Add Credentials to .env**:
   ```bash
   GITHUB_CLIENT_ID="your-client-id"
   GITHUB_CLIENT_SECRET="your-client-secret"
   ```

For Google OAuth:

1. **Google Cloud Console**: Create new project
2. **Enable APIs**: Enable Google+ API
3. **Create Credentials**: OAuth 2.0 client ID
4. **Set Redirect URI**: `http://localhost:4002/api/auth/callback/google`
5. **Add to .env**:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### 7.3 SAML SSO (Optional)

For enterprise SAML SSO:

1. **Navigate to SSO Settings**: `http://localhost:4002/teams/{slug}/sso`
2. **Configure SAML**: Add your IdP metadata
3. **Download SP Metadata**: Provide to your IdP administrator
4. **Test Connection**: Verify SSO flow works

---

## Step 8: Development Workflow

### 8.1 Code Structure

```
├── pages/                  # Next.js pages and API routes
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication pages
│   └── teams/             # Team-scoped pages
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── team/              # Team management components
│   └── shared/            # Reusable components
├── lib/                   # Utilities and configurations
├── models/                # Database models and business logic
├── prisma/                # Database schema and migrations
└── documentation/         # Project documentation
```

### 8.2 Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run check-types

# Linting
npm run check-lint

# Format code
npm run format

# Run all checks
npm run test-all

# Database operations
npx prisma studio              # Database GUI
npx prisma db push            # Push schema changes
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Create migration
```

### 8.3 Testing

```bash
# Unit tests
npm test

# E2E tests with Playwright
npm run test:e2e

# Update Playwright browsers
npm run playwright:update
```

---

## Step 9: Customization

### 9.1 Branding

- **Logo**: Replace `/public/logo.png`
- **Colors**: Update Tailwind config in `tailwind.config.js`
- **Typography**: Modify CSS in `/styles/globals.css`

### 9.2 Features

Enable/disable features by updating environment variables:

```bash
# Feature flags in lib/env.ts
FEATURE_SSO=true
FEATURE_BILLING=true
FEATURE_WEBHOOKS=true
FEATURE_API_KEYS=true
```

### 9.3 Email Templates

Customize email templates in `/components/emailTemplates/`:

- `WelcomeEmail.tsx` - Welcome email for new users
- `InvitationEmail.tsx` - Team invitation email
- `PasswordResetEmail.tsx` - Password reset email

---

## Step 10: Production Deployment

### 10.1 Environment Setup

Create production `.env` file:

```bash
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/db
# ... other production values
```

### 10.2 Build Application

```bash
npm run build
npm start
```

### 10.3 Database Migration

```bash
npx prisma migrate deploy
```

### 10.4 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure NEXTAUTH_SECRET
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry)
- [ ] Configure backup strategy
- [ ] Review security headers

---

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Verify connection string
echo $DATABASE_URL
```

**Authentication Not Working**
```bash
# Check NextAuth configuration
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# Verify email settings
npm run test-email
```

**Build Failures**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

- **Documentation**: `/documentation/` directory
- **API Reference**: `/documentation/api-reference.md`
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join discussions and ask questions

---

## Next Steps

Now that you have the basic setup working:

1. **Customize the UI** to match your brand
2. **Add business logic** specific to your use case
3. **Set up monitoring** with Sentry and analytics
4. **Configure CI/CD** for automated deployments
5. **Add custom integrations** using the API and webhooks
6. **Scale infrastructure** as your user base grows

**Happy building!** 🚀

---

## Quick Reference

### Important URLs
- **Application**: `http://localhost:4002`
- **Database GUI**: `http://localhost:5555`
- **API Base**: `http://localhost:4002/api`

### Key Files
- **Environment**: `.env`
- **Database Schema**: `prisma/schema.prisma`
- **API Routes**: `pages/api/`
- **Components**: `components/`

### Essential Commands
```bash
npm run dev                    # Start development
npx prisma studio             # Database GUI
npx prisma db push            # Update database
npm run test-all              # Run all checks
```