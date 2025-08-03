# Sentry Error Monitoring & Performance Documentation

## Overview

Sentry provides error monitoring, performance tracking, and user session replay for this SaaS starter kit. It captures exceptions, monitors application performance, and provides insights into user experience issues.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/project-id
SENTRY_DSN=https://your-secret-key@o0.ingest.sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token

# Optional: For source maps and releases
SENTRY_ORG=your-organization
SENTRY_PROJECT=your-project-name
```

### Package Dependencies

The starter kit includes Sentry for Next.js:

```json
{
  "@sentry/nextjs": "9.29.0"
}
```

## Implementation Details

### Core Files

- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `instrumentation.ts` - Sentry initialization
- `next.config.js` - Sentry webpack plugin configuration

### Client Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] }),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
});
```

### Server Configuration

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
});
```

## Error Tracking

### Automatic Error Capture

Sentry automatically captures:

- Unhandled exceptions
- Unhandled promise rejections
- React component errors
- API route errors
- Network request failures

### Manual Error Reporting

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exceptions
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// Capture custom messages
Sentry.captureMessage('Something unexpected happened', 'warning');

// Add context before capturing
Sentry.setTag('section', 'billing');
Sentry.setContext('operation', {
  type: 'subscription_update',
  userId: user.id,
});
Sentry.captureException(error);
```

### User Context

```typescript
// Set user context for better error attribution
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
  subscription: user.subscription?.status,
});

// Clear user context on logout
Sentry.setUser(null);
```

## Performance Monitoring

### Custom Spans

```typescript
import { startSpan } from '@sentry/nextjs';

// API route performance tracking
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await startSpan(
    {
      name: 'api.teams.create',
      op: 'http.server',
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
      },
    },
    async (span) => {
      // Database operation tracking
      const team = await startSpan({ name: 'db.team.create', op: 'db' }, () =>
        createTeam(data)
      );

      span.setAttributes({
        'team.id': team.id,
        'user.id': userId,
      });

      return team;
    }
  );

  res.json(result);
}
```

### Database Query Monitoring

```typescript
// Track Prisma operations
const user = await startSpan(
  { name: 'db.user.findUnique', op: 'db.query' },
  () =>
    prisma.user.findUnique({
      where: { id: userId },
      include: { teams: true },
    })
);
```

### External API Monitoring

```typescript
// Track third-party API calls
const stripeCustomer = await startSpan(
  {
    name: 'stripe.customer.create',
    op: 'http.client',
    attributes: {
      'stripe.resource': 'customer',
      'stripe.operation': 'create',
    },
  },
  () =>
    stripe.customers.create({
      email: user.email,
      name: user.name,
    })
);
```

## Session Replay

### Configuration

```typescript
// Enable session replay for debugging
Sentry.init({
  integrations: [
    Sentry.replayIntegration({
      // Capture 10% of normal sessions
      sessionSampleRate: 0.1,
      // Capture 100% of sessions with errors
      errorSampleRate: 1.0,
      // Mask sensitive data
      maskAllText: true,
      maskAllInputs: true,
    }),
  ],
});
```

### Privacy Controls

```typescript
// Mask sensitive elements
<input
  type="password"
  className="sentry-mask" // Automatically masked
/>

<div className="sentry-block">
  {/* This entire section will be blocked */}
  <CreditCardForm />
</div>
```

## Release Tracking

### Automatic Release Detection

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,

  // Automatically create releases
  automaticVercelMonitors: true,
});
```

### Manual Release Configuration

```typescript
// Set release information
Sentry.init({
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
});
```

## Multi-Tenant Context

### Team-Scoped Errors

```typescript
// Set team context for multi-tenant error tracking
export const setTeamContext = (team: Team) => {
  Sentry.setTag('team.id', team.id);
  Sentry.setTag('team.slug', team.slug);
  Sentry.setContext('team', {
    id: team.id,
    name: team.name,
    plan: team.subscription?.plan,
    memberCount: team.members?.length,
  });
};

// Clear team context
export const clearTeamContext = () => {
  Sentry.setTag('team.id', null);
  Sentry.setTag('team.slug', null);
  Sentry.setContext('team', null);
};
```

### Request Context Middleware

```typescript
// middleware.ts - Add request context
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set request context
  Sentry.setTag('route', pathname);
  Sentry.setContext('request', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
  });
}
```

## Alerting & Notifications

### Error Rate Alerts

Set up alerts in Sentry dashboard for:

- Error rate exceeding threshold (e.g., >1% in 5 minutes)
- New issue types detected
- Performance degradation (p95 response time > 2s)
- High memory usage or slow database queries

### Custom Metrics

```typescript
// Track business metrics
import { metrics } from '@sentry/nextjs';

// User signup tracking
metrics.increment('user.signup', 1, {
  tags: {
    plan: subscription.plan,
    source: 'website',
  },
});

// Active users gauge
metrics.gauge('users.active', activeUserCount, {
  tags: {
    team: team.id,
  },
});

// Revenue tracking
metrics.distribution('revenue.mrr', monthlyRevenue, {
  unit: 'dollar',
  tags: {
    currency: 'USD',
  },
});
```

## Data Privacy & Security

### Sensitive Data Filtering

```typescript
// Filter sensitive information
Sentry.init({
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    // Filter sensitive form data
    if (event.request?.data) {
      const data = event.request.data;
      if (typeof data === 'object') {
        delete data.password;
        delete data.creditCard;
        delete data.ssn;
      }
    }

    // Skip development errors in production
    if (
      process.env.NODE_ENV === 'production' &&
      hint.originalException?.message?.includes('dev-only')
    ) {
      return null;
    }

    return event;
  },
});
```

### PII Protection

```typescript
// Disable automatic PII capture for sensitive applications
Sentry.init({
  sendDefaultPii: false, // Don't automatically capture user IP, etc.
  initialScope: {
    tags: {
      component: 'saas-app',
    },
  },
});
```

## Testing & Development

### Development Configuration

```typescript
// Different settings for development
const isDevelopment = process.env.NODE_ENV === 'development';

Sentry.init({
  debug: isDevelopment,
  tracesSampleRate: isDevelopment ? 1.0 : 0.1,
  enabled: !isDevelopment, // Disable in development
  integrations: [
    // Disable session replay in development
    Sentry.replayIntegration({
      sessionSampleRate: isDevelopment ? 0 : 0.1,
    }),
  ],
});
```

### Test Error Endpoint

```typescript
// pages/api/test-sentry.ts - Test Sentry integration
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  Sentry.captureMessage('Test message from API', 'info');
  throw new Error('Test error for Sentry');
}
```

## Monitoring & Dashboards

### Key Metrics to Track

- **Error Rate**: Percentage of requests resulting in errors
- **Response Time**: p95 response time for API endpoints
- **User Experience**: Core Web Vitals (LCP, FID, CLS)
- **Business Metrics**: User signups, subscription conversions
- **Infrastructure**: Memory usage, database query performance

### Custom Dashboards

Create dashboards to monitor:

- Team-specific error rates
- Feature adoption metrics
- Performance by geographical region
- Subscription funnel health

## Troubleshooting

### Common Issues

**Source Maps Not Working**

- Verify `SENTRY_AUTH_TOKEN` is set
- Check organization and project names
- Ensure source map upload in build process

**High Error Volume**

- Implement error sampling for noisy errors
- Filter out bot traffic and known issues
- Set up proper error boundaries in React

**Performance Overhead**

- Reduce trace sample rate in production
- Disable session replay for high-traffic routes
- Use conditional instrumentation

### Health Checks

```typescript
// Check Sentry connectivity
export const checkSentryHealth = async () => {
  try {
    Sentry.captureMessage('Health check', 'info');
    return true;
  } catch (error) {
    console.error('Sentry health check failed:', error);
    return false;
  }
};
```

## Related Files

- `sentry.client.config.ts:1` - Client-side configuration
- `sentry.server.config.ts:1` - Server-side configuration
- `instrumentation.ts:1` - Sentry initialization
- `next.config.js:1` - Build-time configuration
