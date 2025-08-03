# SaaS Starter Kit - Platform Documentation

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Getting Started](#getting-started)
3. [API Reference Documentation](#api-reference-documentation)
4. [Authentication & Authorization](#authentication--authorization)
5. [Architecture and System Design](#architecture-and-system-design)
6. [Data & Storage](#data--storage)
7. [Security & Compliance](#security--compliance)
8. [Common Workflows & How-To Guides](#common-workflows--how-to-guides)
9. [Troubleshooting & FAQ](#troubleshooting--faq)
10. [Appendices](#appendices)

---

## Platform Overview

### What is SaaS Starter Kit?

SaaS Starter Kit is a **multi-tenant SaaS platform foundation** designed to accelerate the development of enterprise-grade Software-as-a-Service applications. It provides a complete, production-ready infrastructure with enterprise features including team management, SSO, billing, and compliance capabilities.

### Key Features

#### 🔐 **Enterprise Authentication**

- Multiple authentication providers (email/password, magic links, GitHub, Google)
- SAML SSO integration via BoxyHQ Jackson
- IdP-initiated login support
- Directory sync (SCIM 2.0) for automated user provisioning

#### 👥 **Multi-Tenant Team Management**

- Teams as core tenant boundaries with unique slugs
- Role-based access control (Owner, Admin, Member)
- Team invitation system with email and link sharing
- Domain-based team restrictions

#### 💳 **Integrated Billing & Payments**

- Stripe integration for subscriptions and one-time payments
- Customer portal for self-service billing management
- Product pricing management
- Subscription lifecycle handling

#### 🔧 **Developer & Integration Features**

- RESTful API with team-scoped endpoints
- API key authentication for external integrations
- Webhook management via Svix for event orchestration
- React Email templates for transactional emails

#### 📊 **Observability & Compliance**

- Comprehensive audit logging via Retraced
- Error monitoring and performance tracking via Sentry
- OpenTelemetry metrics and distributed tracing
- GDPR compliance features

### User Personas

#### **End Users (Team Members)**

Access team-specific features, update personal settings, and participate in team workflows.

#### **Team Administrators (Admin/Owner)**

Manage team members, configure team settings, set up integrations, and handle billing.

#### **System Administrators**

Configure platform-wide settings, monitor system health, and handle compliance requirements.

#### **API Developers/Integrators**

Use team-scoped API keys for programmatic access and build custom integrations.

### Technology Stack

- **Frontend**: Next.js 15 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + NextAuth.js + Prisma ORM
- **Database**: PostgreSQL with multi-tenant data isolation
- **Authentication**: NextAuth.js with multi-provider support
- **Payments**: Stripe for billing and subscriptions
- **Enterprise SSO**: BoxyHQ Jackson (SAML/OIDC)
- **Webhooks**: Svix for event orchestration
- **Monitoring**: Sentry + OpenTelemetry + Mixpanel

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Docker (for local development)
- Stripe account (for billing features)
- Email service (SMTP) for transactional emails

### Quick Setup

#### 1. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/saas_starter_kit"

# NextAuth.js
NEXTAUTH_URL="http://localhost:4002"
NEXTAUTH_SECRET="your-nextauth-secret"

# Email Configuration
SMTP_HOST="your-smtp-server"
SMTP_PORT="587"
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@yourdomain.com"

# OAuth Providers (Optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### 2. Database Setup

Start the database using Docker Compose:

```bash
docker-compose up -d
```

Set up the database schema:

```bash
npx prisma db push
npx prisma db seed
```

#### 3. Start the Application

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:4002`.

### First Steps

#### 1. Create Your Account

- Navigate to `/auth/join`
- Fill out the registration form with your details
- Choose a team name (this becomes your team URL slug)
- Complete email verification if enabled

#### 2. Explore Team Settings

- Access `/teams/{your-team-slug}/settings`
- Configure team details and preferences
- Set up team domain restrictions if needed

#### 3. Invite Team Members

- Go to `/teams/{your-team-slug}/members`
- Use "Add Member" to send invitations
- Choose between email invitations or shareable links
- Assign appropriate roles (Member, Admin, Owner)

#### 4. Configure Integrations

- Set up API keys for external access
- Configure webhooks for event notifications
- Enable billing if using paid features
- Set up SSO for enterprise authentication

---

## API Reference Documentation

The SaaS Starter Kit provides a comprehensive REST API with multi-tenant team management, authentication, and enterprise features. All endpoints use JSON for request/response bodies.

**Base URL:** `http://localhost:4002/api`

### Authentication Methods

#### Session-based Authentication

Used for web application access with NextAuth.js session cookies.

```
Cookie: next-auth.session-token=...
```

#### API Key Authentication

Used for external integrations with team-scoped access.

```
Authorization: Bearer sk_test_...
```

### Error Response Format

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description"
  }
}
```

**HTTP Status Codes:**

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict (duplicate resources)
- `422` - Unprocessable Entity (invalid data)
- `500` - Internal Server Error

### Core API Endpoints

#### Authentication

**POST /api/auth/join**
Register new user with team creation or invitation acceptance.

```bash
curl -X POST http://localhost:4002/api/auth/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "team": "acme-corp"
  }'
```

**POST /api/auth/forgot-password**
Initiate password reset process.

```bash
curl -X POST http://localhost:4002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

#### Team Management

**GET /api/teams**
Get all teams for authenticated user.

```bash
curl -X GET http://localhost:4002/api/teams \
  -H "Cookie: next-auth.session-token=..."
```

**POST /api/teams**
Create new team.

```bash
curl -X POST http://localhost:4002/api/teams \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Acme Corporation"
  }'
```

**GET /api/teams/{slug}**
Get team details.

```bash
curl -X GET http://localhost:4002/api/teams/acme-corp \
  -H "Cookie: next-auth.session-token=..."
```

#### Team Members

**GET /api/teams/{slug}/members**
Get team members list.

```bash
curl -X GET http://localhost:4002/api/teams/acme-corp/members \
  -H "Cookie: next-auth.session-token=..."
```

**POST /api/teams/{slug}/invitations**
Create team invitation.

```bash
curl -X POST http://localhost:4002/api/teams/acme-corp/invitations \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "email": "user@example.com",
    "role": "ADMIN",
    "sentViaEmail": true
  }'
```

#### API Keys

**GET /api/teams/{slug}/api-keys**
Get team API keys.

```bash
curl -X GET http://localhost:4002/api/teams/acme-corp/api-keys \
  -H "Cookie: next-auth.session-token=..."
```

**POST /api/teams/{slug}/api-keys**
Create new API key.

```bash
curl -X POST http://localhost:4002/api/teams/acme-corp/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Production API Key"
  }'
```

#### Webhooks

**GET /api/teams/{slug}/webhooks**
Get team webhooks.

```bash
curl -X GET http://localhost:4002/api/teams/acme-corp/webhooks \
  -H "Cookie: next-auth.session-token=..."
```

**POST /api/teams/{slug}/webhooks**
Create webhook endpoint.

```bash
curl -X POST http://localhost:4002/api/teams/acme-corp/webhooks \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Member Events",
    "url": "https://api.example.com/webhooks",
    "eventTypes": ["member.created", "member.removed"]
  }'
```

### Using API Keys

Once you have an API key, use it for external integrations:

```bash
curl -X GET http://localhost:4002/api/teams/acme-corp/members \
  -H "Authorization: Bearer sk_test_your_api_key_here" \
  -H "Content-Type: application/json"
```

### Webhook Events

The platform supports the following webhook events:

- `member.created` - New team member added
- `member.removed` - Team member removed
- `invitation.created` - Team invitation sent
- `invitation.removed` - Team invitation deleted

---

## Authentication & Authorization

### Authentication Methods

#### 1. Email/Password Authentication

Traditional credentials-based login with security features:

- Password strength requirements
- Account lockout after failed attempts
- Password reset via email tokens

#### 2. Magic Link Authentication

Passwordless login via email:

- Secure token generation
- Time-limited access links
- Email verification integration

#### 3. OAuth Authentication

Third-party provider integration:

- **GitHub**: Developer-focused authentication
- **Google**: Consumer and business accounts
- Account linking for multiple providers

#### 4. SAML SSO (Enterprise)

Enterprise single sign-on via BoxyHQ Jackson:

- SAML 2.0 protocol support
- IdP-initiated login
- Just-in-time user provisioning
- Automatic team assignment

#### 5. API Key Authentication

Programmatic access for integrations:

- Team-scoped API keys
- SHA-256 hash storage
- Usage tracking and audit logs

### Authorization Model

#### Role-Based Access Control (RBAC)

**Role Hierarchy:**

1. **Owner** - Complete control including billing and team deletion
2. **Admin** - Full team management except billing
3. **Member** - Basic team access and participation

**Permission Matrix:**

| Resource          | Owner | Admin | Member |
| ----------------- | ----- | ----- | ------ |
| Team Settings     | ✅    | ✅    | ❌     |
| Member Management | ✅    | ✅    | ❌     |
| Billing           | ✅    | ❌    | ❌     |
| API Keys          | ✅    | ✅    | ❌     |
| Webhooks          | ✅    | ✅    | ❌     |
| SSO Configuration | ✅    | ✅    | ❌     |
| Team Deletion     | ✅    | ❌    | ❌     |

#### Team-Scoped Access

- All resources are scoped to specific teams
- Users can belong to multiple teams with different roles
- API keys are team-specific
- Audit logs track team-level activities

### Security Features

#### Account Protection

- Account lockout after 5 failed login attempts
- 30-minute lockout duration
- Email notifications for security events
- Password strength requirements

#### Session Management

- Configurable session strategies (JWT or database)
- Session timeout and rotation
- Multi-device session tracking
- Secure logout across all devices

#### Input Validation

- Server-side validation for all inputs
- Protection against common attacks (XSS, CSRF, SQL injection)
- Rate limiting on authentication endpoints
- reCAPTCHA integration for bot protection

---

## Architecture and System Design

### System Architecture

The SaaS Starter Kit follows a monolithic Next.js architecture with clear separation of concerns:

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Components]
        B[Next.js Pages]
        C[Custom Hooks]
    end

    subgraph "API Layer"
        D[Next.js API Routes]
        E[Authentication Middleware]
        F[Permission Checks]
    end

    subgraph "Business Logic"
        G[Domain Models]
        H[Service Layer]
        I[External Integrations]
    end

    subgraph "Data Layer"
        J[Prisma ORM]
        K[PostgreSQL Database]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    G --> J
    J --> K
```

### Container Architecture

**Technology Choices:**

- **Next.js 15**: Full-stack React framework
- **PostgreSQL**: Primary database with ACID compliance
- **NextAuth.js**: Authentication framework
- **BoxyHQ Jackson**: Enterprise SSO service
- **External Services**: Stripe, Svix, Sentry, etc.

### Multi-Tenancy Design

**Team-Based Isolation:**

- Teams serve as tenant boundaries
- All data scoped via team foreign keys
- URL-based tenancy with team slugs
- Role-based permissions within teams

**Database Strategy:**

- Shared database with logical isolation
- Composite indexes for multi-tenant queries
- Row-level security via application logic
- Audit trails for compliance

### Scalability Patterns

**Horizontal Scaling:**

- Stateless application design
- Database connection pooling
- CDN integration for static assets
- Load balancer ready

**Performance Optimization:**

- Database query optimization
- Caching strategy with Redis
- Image optimization
- Code splitting and lazy loading

---

## Data & Storage

### Database Schema

The platform uses PostgreSQL with Prisma ORM for type-safe database operations.

#### Core Models

**User Model:**

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?

  // Security fields
  lockedAt      DateTime?
  loginAttempts Int       @default(0)

  // Relationships
  accounts      Account[]
  sessions      Session[]
  teamMembers   TeamMember[]
  invitations   Invitation[] @relation("InvitedBy")
  apiKeys       ApiKey[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Team Model:**

```prisma
model Team {
  id   String @id @default(cuid())
  name String
  slug String @unique

  // Billing integration
  stripeCustomerId     String?
  stripeSubscriptionId String?
  billingStatus        String?

  // Feature flags
  features Json @default("{}")

  // Relationships
  members     TeamMember[]
  invitations Invitation[]
  apiKeys     ApiKey[]
  webhooks    Webhook[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**TeamMember Model:**

```prisma
model TeamMember {
  id     String @id @default(cuid())
  userId String @map("user_id")
  teamId String @map("team_id")
  role   Role   @default(MEMBER)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, teamId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}
```

### Data Access Patterns

#### Multi-Tenant Queries

All queries are team-scoped for security:

```typescript
// Safe multi-tenant query pattern
export async function getTeamMembers(teamSlug: string, userId: string) {
  // Always verify user has access to team
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      user: { id: userId },
      team: { slug: teamSlug },
    },
    include: { team: true },
  });

  if (!teamMember) {
    throw new AuthorizationError('Access denied to team');
  }

  // All subsequent queries are safe
  return await prisma.teamMember.findMany({
    where: { team: { slug: teamSlug } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}
```

#### Performance Optimization

- Composite indexes for common query patterns
- Connection pooling via Prisma
- Query optimization and monitoring
- Slow query detection and alerting

### Backup and Recovery

**Backup Strategy:**

- Automated daily backups
- Point-in-time recovery capability
- Encrypted backup storage
- Regular restore testing

**Data Migration:**

- Prisma migration system
- Schema versioning
- Safe migration rollback
- Data seeding for development

---

## Security & Compliance

### Security Architecture

#### Defense in Depth

Multiple layers of security protection:

1. **Network Security**: TLS encryption, security headers, DDoS protection
2. **Application Security**: Input validation, authentication, authorization
3. **Data Security**: Encryption at rest and in transit, secure sessions
4. **Infrastructure Security**: Container security, access controls

#### Data Protection

**Encryption:**

- TLS 1.3 for data in transit
- Database encryption for sensitive fields
- Secure session storage
- API key hashing with SHA-256

**Privacy Features:**

- GDPR compliance tools
- Data export functionality
- Right to be forgotten implementation
- Consent management

#### Audit and Compliance

**Audit Logging:**

- Comprehensive activity tracking via Retraced
- Immutable audit trails
- Compliance reporting
- Real-time monitoring

**Compliance Standards:**

- SOC 2 Type II ready
- GDPR compliant features
- HIPAA considerations
- Industry-standard security practices

### Security Monitoring

**Threat Detection:**

- Failed login attempt monitoring
- Suspicious activity alerts
- Account lockout notifications
- API abuse detection

**Incident Response:**

- Automated security alerts
- Slack notifications for critical events
- Error tracking via Sentry
- Performance monitoring

---

## Common Workflows & How-To Guides

### Team Management Workflows

#### Setting Up a New Team

1. **Create Team Account**

   - Register at `/auth/join`
   - Choose unique team name
   - Complete email verification
   - Access team dashboard

2. **Configure Team Settings**

   - Navigate to `/teams/{slug}/settings`
   - Update team name and branding
   - Set domain restrictions if needed
   - Configure notification preferences

3. **Invite Team Members**
   - Go to `/teams/{slug}/members`
   - Click "Add Member"
   - Choose invitation method:
     - Email invitation with role assignment
     - Shareable invitation link
   - Monitor pending invitations
   - Follow up on acceptance

#### Managing Team Members

**Adding Members:**

- Use email invitations for specific users
- Generate shareable links for bulk invitations
- Assign appropriate roles (Member, Admin, Owner)
- Set expiration dates for invitations

**Updating Roles:**

- Select member from list
- Choose new role from dropdown
- Confirm role change
- Notify member of changes

**Removing Members:**

- Find member in team list
- Click remove action
- Confirm removal
- Member loses access immediately

### Enterprise SSO Setup

#### SAML Configuration

1. **Prerequisites**

   - Team with SSO feature enabled
   - Admin/Owner permissions
   - Identity Provider access

2. **Setup Steps**

   - Navigate to `/teams/{slug}/sso`
   - Choose SAML protocol
   - Enter IdP metadata URL or upload file
   - Configure attribute mappings
   - Download SP metadata
   - Provide metadata to IdP administrator

3. **Testing and Activation**
   - Test SSO connection
   - Verify user mappings
   - Enable for team members
   - Communicate login process

#### Directory Sync (SCIM)

1. **Enable Directory Sync**

   - Access `/teams/{slug}/directory-sync`
   - Create new connection
   - Generate SCIM credentials
   - Configure endpoint URL

2. **IdP Configuration**
   - Provide SCIM endpoint to IdP
   - Configure user/group mappings
   - Set up automatic provisioning
   - Test sync functionality

### API Integration

#### API Key Management

1. **Create API Key**

   - Navigate to `/teams/{slug}/api-keys`
   - Click "Create API Key"
   - Enter descriptive name
   - Copy generated key (shown only once)
   - Store securely

2. **Using API Keys**

   ```bash
   curl -X GET http://localhost:4002/api/teams/acme-corp/members \
     -H "Authorization: Bearer sk_test_your_key_here"
   ```

3. **Key Rotation**
   - Create new API key
   - Update applications to use new key
   - Delete old API key
   - Monitor for any issues

#### Webhook Configuration

1. **Create Webhook**

   - Go to `/teams/{slug}/webhooks`
   - Click "Add Webhook"
   - Enter endpoint URL
   - Select event types
   - Configure authentication

2. **Handle Webhook Events**
   ```javascript
   // Example webhook handler
   app.post('/webhook', (req, res) => {
     const event = req.body;

     switch (event.type) {
       case 'member.created':
         handleNewMember(event.data);
         break;
       case 'member.removed':
         handleMemberRemoval(event.data);
         break;
     }

     res.status(200).send('OK');
   });
   ```

### Billing and Payments

#### Setting Up Billing

1. **Configure Stripe**

   - Add Stripe keys to environment
   - Set up webhook endpoints
   - Configure products and pricing

2. **Enable Team Billing**

   - Navigate to `/teams/{slug}/billing`
   - View available plans
   - Select appropriate subscription
   - Complete Stripe checkout

3. **Manage Subscriptions**
   - Access customer portal
   - Update payment methods
   - View billing history
   - Change subscription plans

---

## Troubleshooting & FAQ

### Common Issues

#### Authentication Problems

**Q: Users can't log in after multiple failed attempts**
A: Check account lockout status. Accounts are automatically locked after 5 failed login attempts for 30 minutes. Use the unlock account API or wait for automatic unlock.

**Q: OAuth authentication not working**
A: Verify OAuth provider configuration:

- Check client ID and secret
- Confirm callback URLs are correct
- Ensure environment variables are set
- Check provider-specific settings

**Q: SAML SSO failing**
A: Common SAML issues:

- Verify metadata exchange is complete
- Check certificate validity
- Confirm attribute mappings
- Test with IdP test tools

#### Team Management Issues

**Q: Invitation emails not being received**
A: Check email configuration:

- Verify SMTP settings
- Check spam/junk folders
- Confirm email delivery logs
- Test with different email providers

**Q: Can't remove team member**
A: Verify permissions:

- Only Admins/Owners can remove members
- Cannot remove yourself
- Check for pending operations
- Ensure user is still team member

**Q: API keys not working**
A: Troubleshoot API key issues:

- Verify key format and validity
- Check team scope matches request
- Confirm API key hasn't expired
- Review audit logs for usage

#### Payment and Billing

**Q: Stripe checkout not working**
A: Check Stripe configuration:

- Verify API keys are correct
- Confirm webhook endpoints
- Check product/price IDs
- Review Stripe dashboard for errors

**Q: Subscription not updating**
A: Webhook processing issues:

- Check webhook delivery logs
- Verify signature validation
- Review error logs
- Test webhook endpoints manually

### Performance Issues

**Q: Slow page load times**
A: Optimize performance:

- Check database query performance
- Review network latency
- Optimize images and assets
- Monitor server resources

**Q: Database connection errors**
A: Database troubleshooting:

- Check connection pool settings
- Verify database server status
- Review connection limits
- Monitor query performance

### Security Concerns

**Q: Suspicious login activity**
A: Security response:

- Review audit logs
- Check for account compromise
- Reset passwords if needed
- Enable additional security measures

**Q: API rate limiting**
A: Rate limit management:

- Review API usage patterns
- Implement proper retry logic
- Consider increasing limits
- Optimize API calls

### Getting Help

#### Support Channels

1. **Documentation**: Comprehensive guides and API reference
2. **Community**: GitHub discussions and issues
3. **Security Issues**: security@yourdomain.com
4. **General Support**: support@yourdomain.com

#### Diagnostic Information

When reporting issues, include:

- Error messages and stack traces
- Browser/environment details
- Steps to reproduce
- Expected vs actual behavior
- Relevant log entries

---

## Appendices

### Glossary of Terms

**API Key**: Team-scoped authentication token for external integrations

**Audit Log**: Immutable record of system activities for compliance

**Directory Sync**: Automated user provisioning via SCIM protocol

**IdP**: Identity Provider for SSO authentication

**Multi-Tenant**: Architecture supporting multiple isolated customers

**RBAC**: Role-Based Access Control for permission management

**SAML**: Security Assertion Markup Language for SSO

**SCIM**: System for Cross-domain Identity Management

**Team**: Primary tenant boundary in the platform

**Webhook**: HTTP callback for real-time event notifications

### Environment Variables Reference

#### Required Variables

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:4002"
NEXTAUTH_SECRET="random-secret"
```

#### Optional Features

```bash
# OAuth Providers
GITHUB_CLIENT_ID="github-client-id"
GITHUB_CLIENT_SECRET="github-client-secret"
GOOGLE_CLIENT_ID="google-client-id"
GOOGLE_CLIENT_SECRET="google-client-secret"

# Billing
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="username"
SMTP_PASSWORD="password"
EMAIL_FROM="noreply@yourdomain.com"

# Security
RECAPTCHA_SITE_KEY="recaptcha-site-key"
RECAPTCHA_SECRET_KEY="recaptcha-secret-key"

# Monitoring
SENTRY_DSN="https://sentry-dsn"
MIXPANEL_TOKEN="mixpanel-token"
```

### Feature Flags

Control platform features via environment configuration:

```javascript
const teamFeatures = {
  sso: env.teamFeatures.sso,
  dsync: env.teamFeatures.dsync,
  webhook: env.teamFeatures.webhook,
  apiKey: env.teamFeatures.apiKey,
  payments: env.teamFeatures.payments,
  deleteTeam: env.teamFeatures.deleteTeam,
};
```

### Changelog

#### Version 1.0.0

- Initial release with core features
- Multi-tenant team management
- Enterprise SSO support
- Stripe billing integration
- Comprehensive API

#### Future Roadmap

- Mobile application support
- Advanced analytics dashboard
- Additional SSO providers
- Enhanced audit capabilities
- Performance optimizations

---

This documentation provides a comprehensive guide for using and integrating with the SaaS Starter Kit platform. For additional support or questions, please refer to the community resources or contact support.
