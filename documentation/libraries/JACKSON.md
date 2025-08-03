# BoxyHQ Jackson (SAML SSO & Directory Sync) Documentation

## Overview

BoxyHQ Jackson provides SAML SSO and Directory Sync (SCIM) capabilities for this SaaS starter kit. It bridges SAML login flows to OAuth 2.0/OpenID Connect, abstracting SAML protocol complexities while supporting multi-tenant architecture.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Core Configuration (Required)
APP_URL=http://localhost:4002
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Feature Flags
FEATURE_TEAM_SSO=true
FEATURE_TEAM_DSYNC=true

# Self-hosted Jackson (Optional)
JACKSON_URL=http://localhost:5225
JACKSON_EXTERNAL_URL=https://sso.eu.boxyhq.com
JACKSON_API_KEY=secret
JACKSON_PRODUCT_ID=boxyhq
JACKSON_WEBHOOK_SECRET=your-webhook-secret

# IdP-initiated Login (Optional)
IDP_ENABLED=true
```

### Database Configuration Options

```env
# Database Engine Options
DB_ENGINE=sql                    # Options: redis, sql, mongo, mem, planetscale, dynamodb
DB_TYPE=postgres                 # Options: postgres, cockroachdb, mysql, mariadb, mssql

# Directory Sync Configuration
DSYNC_WEBHOOK_BATCH_SIZE=100
DSYNC_GOOGLE_CLIENT_ID=your-google-client-id
DSYNC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Implementation Details

### Core Files

- `lib/jackson.ts` - Jackson client configuration
- `lib/jackson/` - SSO and Directory Sync utilities
- `pages/api/oauth/` - OAuth endpoints for SAML flows
- `pages/api/auth/sso/` - SSO authentication endpoints
- `pages/api/scim/` - SCIM endpoints for Directory Sync
- `components/` - SSO configuration UI components

### Jackson Configuration

```typescript
// lib/jackson.ts
const opts: JacksonOption = {
  externalUrl: env.appUrl,
  samlPath: '/api/oauth/saml',
  oidcPath: '/api/oauth/oidc',
  samlAudience: 'https://saml.boxyhq.com',
  db: {
    engine: 'sql',
    type: 'postgres',
    url: env.databaseUrl,
  },
  idpDiscoveryPath: '/auth/sso/idp-select',
  idpEnabled: true,
  openid: {},
};
```

### NextAuth.js Integration

#### SAML SSO Provider

```typescript
// lib/nextAuth.ts
providers.push(
  BoxyHQSAMLProvider({
    authorization: { params: { scope: '' } },
    issuer: env.jackson.selfHosted ? env.jackson.externalUrl : env.appUrl,
    clientId: 'dummy',
    clientSecret: 'dummy',
    allowDangerousEmailAccountLinking: true,
    httpOptions: {
      timeout: 30000,
    },
  })
);
```

#### IdP-Initiated Login Provider

```typescript
CredentialsProvider({
  id: 'boxyhq-idp',
  name: 'IdP Login',
  credentials: {
    code: { type: 'text' },
  },
  async authorize(credentials) {
    const { code } = credentials || {};

    // Exchange code for access token and get user info
    const accessToken = await exchangeCodeForToken(code);
    const userInfo = await getUserInfo(accessToken);

    return userInfo;
  },
});
```

## SAML SSO Setup

### 1. Identity Provider Configuration

#### Supported IdPs

- Active Directory Federation Services (ADFS)
- Azure Active Directory
- Okta
- OneLogin
- Google Workspace
- Any SAML 2.0 compliant IdP

#### Required IdP Settings

```xml
<!-- Service Provider Entity ID -->
<EntityDescriptor entityID="https://saml.boxyhq.com">

<!-- Assertion Consumer Service -->
<AssertionConsumerService
  Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
  Location="https://yourapp.com/api/oauth/saml"
  index="0" />

<!-- Single Logout Service -->
<SingleLogoutService
  Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
  Location="https://yourapp.com/api/oauth/saml/slo" />
```

### 2. SAML Connection Creation

#### Via API

```bash
curl -X POST 'http://localhost:4002/api/oauth/saml' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'rawMetadata=<IdP XML metadata>' \
  -d 'defaultRedirectUrl=http://localhost:4002/dashboard' \
  -d 'redirectUrl=["http://localhost:4002/*"]' \
  -d 'tenant=company.com' \
  -d 'product=saas-starter-kit'
```

#### Via UI Components

The starter kit includes UI components for SAML configuration:

- Team SSO settings page (`pages/teams/[slug]/sso.tsx`)
- SAML connection form (`components/sso/`)
- IdP selection page (`pages/auth/sso/idp-select.tsx`)

### 3. Multi-Tenant Configuration

#### Tenant Identification

```typescript
// Extract tenant from user email domain
const getTenantFromEmail = (email: string) => {
  return email.split('@')[1]; // e.g., 'company.com'
};

// Use team ID as tenant identifier
const tenant = team.id;
const product = 'saas-starter-kit';
```

#### Team-Scoped SSO

Each team gets its own SSO configuration:

```typescript
// lib/jackson/sso/utils.ts
export const getConnection = async (tenant: string, product: string) => {
  const { connectionAPIController } = await jackson();

  const connections = await connectionAPIController.getConnections({
    tenant,
    product,
  });

  return connections[0];
};
```

## Directory Sync (SCIM) Implementation

### 1. SCIM Endpoint Configuration

#### API Routes

- `pages/api/scim/v2.0/[...directory].ts` - Main SCIM endpoint
- `pages/api/webhooks/dsync.ts` - Directory sync webhook handler

#### SCIM Operations

```typescript
// Handle SCIM requests
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { directorySync } = await jackson();

  const { data, status } = await directorySync.requests.handle(req, res, {
    directoryId: req.query.directoryId as string,
  });

  res.status(status).json(data);
}
```

### 2. Directory Sync Events

#### Event Handling

```typescript
// pages/api/webhooks/dsync.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { directorySync } = await jackson();

  const { data } = await directorySync.requests.handle(req, res);

  // Process directory sync events
  switch (data.event) {
    case 'user.created':
      await handleUserCreated(data.data);
      break;
    case 'user.updated':
      await handleUserUpdated(data.data);
      break;
    case 'user.deleted':
      await handleUserDeleted(data.data);
      break;
    case 'group.created':
      await handleGroupCreated(data.data);
      break;
  }

  res.status(200).json({ success: true });
}
```

### 3. Google Workspace Integration

#### Configuration

```env
DSYNC_GOOGLE_CLIENT_ID=your-google-client-id
DSYNC_GOOGLE_CLIENT_SECRET=your-google-client-secret
DSYNC_GOOGLE_REDIRECT_URI=https://yourapp.com/api/oauth/callback
```

#### User Provisioning

```typescript
const handleUserCreated = async (userData: SCIMUser) => {
  const user = await createUser({
    email: userData.emails[0].value,
    name: userData.displayName,
    externalId: userData.id,
  });

  // Add user to appropriate team based on groups
  for (const group of userData.groups) {
    await addUserToTeam(user.id, group.value);
  }
};
```

## Security Best Practices

### SAML Security

- **SP-initiated flows preferred** over IdP-initiated for better security
- **Validate redirect URLs** to prevent malicious redirects
- **SAML audience validation** ensures intended recipient
- **Signature verification** for SAML assertions

### API Security

```typescript
// Secure API endpoints with proper authentication
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify team access
  const teamMember = await throwIfNoTeamAccess(req, res);

  // Check SSO feature is enabled
  if (!env.teamFeatures.sso) {
    return res.status(404).json({ error: 'SSO not available' });
  }

  // Process request...
}
```

### Environment Security

- Store sensitive configuration in environment variables
- Use secure connection strings for databases
- Implement webhook signature verification
- Regular security updates and patching

## Authentication Flows

### SP-Initiated SSO Flow

1. User clicks "Login with SSO" button
2. Application redirects to `/auth/sso/idp-select`
3. User enters email or selects organization
4. System identifies tenant and redirects to IdP
5. User authenticates with IdP
6. IdP sends SAML assertion to `/api/oauth/saml`
7. Jackson verifies assertion and creates session
8. User redirected to application dashboard

### IdP-Initiated SSO Flow

1. User clicks application link in IdP portal
2. IdP sends SAML assertion to `/api/oauth/saml`
3. Jackson processes assertion and generates auth code
4. User redirected to `/auth/idp-login?code=xxx`
5. NextAuth.js exchanges code for user session
6. User redirected to application dashboard

## Troubleshooting

### Common Issues

#### SAML Configuration Errors

```typescript
// Check SAML connection status
const connection = await getConnection(tenant, product);
if (!connection) {
  throw new Error('SAML connection not found');
}

// Validate metadata
if (!connection.idpMetadata) {
  throw new Error('IdP metadata is missing');
}
```

#### Directory Sync Issues

```typescript
// Check directory sync status
const directory = await getDirectory(directoryId);
if (directory.status !== 'active') {
  throw new Error('Directory sync is not active');
}

// Validate webhook configuration
if (!directory.webhook?.endpoint) {
  throw new Error('Webhook endpoint not configured');
}
```

### Debug Tools

#### SAML Tracer

Access SAML traces through the admin interface:

- View failed SAML requests/responses
- Inspect assertion details
- Check signature validation errors
- Review redirect URL violations

#### Health Check

```bash
# Check Jackson health
curl http://localhost:4002/api/health

# Returns service status and version information
```

### Error Logging

```typescript
// Enhanced error logging for SSO issues
try {
  const profile = await exchangeCodeForProfile(code);
  return profile;
} catch (error) {
  console.error('SSO authentication failed', {
    error: error.message,
    tenant,
    product,
    timestamp: new Date().toISOString(),
  });
  throw error;
}
```

## Production Deployment

### Pre-Launch Checklist

- [ ] Configure production database
- [ ] Set up HTTPS endpoints
- [ ] Update SAML audience configuration
- [ ] Test all IdP integrations
- [ ] Configure directory sync webhooks
- [ ] Set up monitoring and alerting
- [ ] Verify security settings

### Monitoring

- Track SSO login success/failure rates
- Monitor directory sync event processing
- Set up alerts for authentication errors
- Review SAML tracer logs regularly

## Related Files

- `lib/jackson.ts:1` - Core Jackson configuration
- `lib/jackson/sso/index.ts:1` - SSO utility functions
- `lib/jackson/dsync/index.ts:1` - Directory sync utilities
- `pages/api/oauth/saml.ts:1` - SAML authentication endpoint
- `pages/api/scim/v2.0/[...directory].ts:1` - SCIM API endpoint
