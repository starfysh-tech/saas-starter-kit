# Mixpanel Analytics Integration Guide

Mixpanel provides user analytics and event tracking for this SaaS application, enabling detailed insights into user behavior and product usage.

## Overview

Mixpanel tracks:

- User events and interactions
- User properties and profiles
- Funnel analysis and conversion tracking
- Cohort analysis and retention metrics
- A/B testing and feature flag support

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Mixpanel Configuration
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-project-token
```

### Installation

Mixpanel is already included in the project dependencies. The integration is set up in `pages/_app.tsx`.

## Setup

### Initialize Mixpanel

In `pages/_app.tsx`:

```typescript
import mixpanel from 'mixpanel-browser'
import { useEffect } from 'react'

// Initialize Mixpanel
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage',
  })
}

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Track page views
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.track_pageview()
    }
  }, [])

  return <Component {...pageProps} />
}
```

### Utility Functions

Create `lib/analytics.ts`:

```typescript
import mixpanel from 'mixpanel-browser';

class Analytics {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (!this.isEnabled) return;

    mixpanel.identify(userId);

    if (traits) {
      mixpanel.people.set(traits);
    }
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    mixpanel.track(event, {
      ...properties,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    });
  }

  setUserProperties(properties: Record<string, any>) {
    if (!this.isEnabled) return;

    mixpanel.people.set(properties);
  }

  setUserPropertiesOnce(properties: Record<string, any>) {
    if (!this.isEnabled) return;

    mixpanel.people.set_once(properties);
  }

  incrementUserProperty(property: string, value: number = 1) {
    if (!this.isEnabled) return;

    mixpanel.people.increment(property, value);
  }

  trackCharge(amount: number, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    mixpanel.people.track_charge(amount, properties);
  }

  alias(newId: string) {
    if (!this.isEnabled) return;

    mixpanel.alias(newId);
  }

  reset() {
    if (!this.isEnabled) return;

    mixpanel.reset();
  }

  timeEvent(eventName: string) {
    if (!this.isEnabled) return;

    mixpanel.time_event(eventName);
  }

  registerSuperProperties(properties: Record<string, any>) {
    if (!this.isEnabled) return;

    mixpanel.register(properties);
  }
}

export const analytics = new Analytics();
```

## Event Tracking

### Common Events

```typescript
import { analytics } from '@/lib/analytics';

// User Registration
analytics.track('User Registered', {
  method: 'email', // or 'google', 'github'
  plan: 'free',
});

// User Login
analytics.track('User Logged In', {
  method: 'email',
});

// Team Creation
analytics.track('Team Created', {
  team_name: 'My Team',
  team_size: 1,
});

// Feature Usage
analytics.track('Feature Used', {
  feature_name: 'api_keys',
  action: 'created',
});

// Subscription Events
analytics.track('Subscription Started', {
  plan: 'pro',
  price: 29.99,
  billing_cycle: 'monthly',
});

// Error Tracking
analytics.track('Error Occurred', {
  error_type: 'api_error',
  error_message: 'Failed to create API key',
  page: '/dashboard/api-keys',
});
```

### User Identification

```typescript
import { analytics } from '@/lib/analytics';

// Identify user on login
function handleUserLogin(user: User) {
  analytics.identify(user.id, {
    email: user.email,
    name: user.name,
    created_at: user.createdAt,
    plan: user.plan,
  });

  analytics.track('User Logged In');
}

// Set user properties
function updateUserProfile(user: User) {
  analytics.setUserProperties({
    name: user.name,
    email: user.email,
    plan: user.plan,
    team_count: user.teams.length,
  });
}
```

### Page View Tracking

```typescript
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

export function usePageTracking() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analytics.track('Page Viewed', {
        page: url,
        referrer: document.referrer,
      });
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
}
```

## User Properties

### Profile Properties

```typescript
// Set user properties on registration
analytics.setUserPropertiesOnce({
  'First Login Date': new Date().toISOString(),
  'Signup Method': 'email',
  'Initial Plan': 'free',
});

// Update user properties
analytics.setUserProperties({
  'Current Plan': 'pro',
  'Team Count': 3,
  'Last Active': new Date().toISOString(),
});

// Increment counters
analytics.incrementUserProperty('Login Count');
analytics.incrementUserProperty('API Calls Made', 10);
```

### Revenue Tracking

```typescript
// Track subscription charges
analytics.trackCharge(29.99, {
  Plan: 'Pro',
  'Billing Cycle': 'monthly',
  'Payment Method': 'credit_card',
});

// Track one-time purchases
analytics.trackCharge(99.99, {
  Product: 'Custom Integration',
  'Payment Method': 'stripe',
});
```

## A/B Testing & Feature Flags

### Feature Flag Tracking

```typescript
// Track feature flag exposure
analytics.track('Feature Flag Seen', {
  flag_name: 'new_dashboard_ui',
  flag_value: 'variant_b',
});

// Track feature engagement
analytics.track('Feature Engaged', {
  feature_name: 'new_dashboard_ui',
  action: 'clicked_cta',
});
```

## Integration with Authentication

### NextAuth.js Integration

```typescript
// In your NextAuth callbacks
export const { handlers, auth } = NextAuth({
  callbacks: {
    async signIn({ user, account }) {
      // Track successful sign-in
      if (typeof window !== 'undefined') {
        analytics.identify(user.id, {
          email: user.email,
          name: user.name,
        });

        analytics.track('User Logged In', {
          method: account?.provider || 'credentials',
        });
      }

      return true;
    },

    async session({ session, token }) {
      // Ensure user is identified in each session
      if (typeof window !== 'undefined' && session.user) {
        analytics.identify(session.user.id);
      }

      return session;
    },
  },
});
```

## Custom Hook for Analytics

```typescript
import { useSession } from 'next-auth/react';
import { analytics } from '@/lib/analytics';

export function useAnalytics() {
  const { data: session } = useSession();

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    const enrichedProperties = {
      ...properties,
      user_id: session?.user?.id,
      user_email: session?.user?.email,
    };

    analytics.track(event, enrichedProperties);
  };

  const identifyUser = (traits?: Record<string, any>) => {
    if (session?.user?.id) {
      analytics.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        ...traits,
      });
    }
  };

  return {
    track: trackEvent,
    identify: identifyUser,
    setUserProperties: analytics.setUserProperties,
    incrementProperty: analytics.incrementUserProperty,
  };
}
```

## Server-Side Tracking

For server-side events, install the Node.js library:

```bash
npm install mixpanel
```

Create `lib/analytics-server.ts`:

```typescript
import Mixpanel from 'mixpanel';

const mixpanel = process.env.MIXPANEL_SECRET_KEY
  ? Mixpanel.init(process.env.MIXPANEL_SECRET_KEY)
  : null;

export class ServerAnalytics {
  track(event: string, properties: Record<string, any> = {}) {
    if (!mixpanel) return;

    mixpanel.track(event, {
      ...properties,
      timestamp: new Date(),
      source: 'server',
    });
  }

  setUserProfile(userId: string, properties: Record<string, any>) {
    if (!mixpanel) return;

    mixpanel.people.set(userId, properties);
  }

  trackCharge(
    userId: string,
    amount: number,
    properties?: Record<string, any>
  ) {
    if (!mixpanel) return;

    mixpanel.people.track_charge(userId, amount, properties);
  }
}

export const serverAnalytics = new ServerAnalytics();
```

## Privacy & GDPR Compliance

### Opt-out Functionality

```typescript
import { analytics } from '@/lib/analytics';

// Opt user out of tracking
export function optOutOfTracking() {
  if (typeof window !== 'undefined') {
    mixpanel.opt_out_tracking();
    localStorage.setItem('analytics_opted_out', 'true');
  }
}

// Opt user back in
export function optInToTracking() {
  if (typeof window !== 'undefined') {
    mixpanel.opt_in_tracking();
    localStorage.removeItem('analytics_opted_out');
  }
}

// Check opt-out status
export function isOptedOut(): boolean {
  if (typeof window !== 'undefined') {
    return (
      mixpanel.has_opted_out_tracking() ||
      localStorage.getItem('analytics_opted_out') === 'true'
    );
  }
  return false;
}
```

### Data Deletion

```typescript
// Delete user data (GDPR compliance)
export function deleteUserData(userId: string) {
  // Client-side reset
  analytics.reset();

  // Server-side deletion requires Mixpanel API call
  // This should be handled in your backend
}
```

## Performance Considerations

### Lazy Loading

```typescript
// Lazy load Mixpanel to improve page performance
import { lazy } from 'react';

const loadMixpanel = () => {
  if (typeof window !== 'undefined' && !window.mixpanel) {
    import('mixpanel-browser').then((mixpanel) => {
      mixpanel.default.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!);
    });
  }
};

// Call loadMixpanel() when user interacts with the page
```

### Batch Events

```typescript
// Queue events and send in batches
class BatchedAnalytics {
  private queue: Array<{ event: string; properties: Record<string, any> }> = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startBatching();
  }

  track(event: string, properties?: Record<string, any>) {
    this.queue.push({ event, properties: properties || {} });
  }

  private startBatching() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  private flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    events.forEach(({ event, properties }) => {
      analytics.track(event, properties);
    });
  }
}
```

## Debugging

### Development Mode

```typescript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
    debug: true,
    loaded: (mixpanel) => {
      console.log('Mixpanel loaded successfully');
    },
  });
}
```

### Event Validation

```typescript
// Validate events before sending
function validateEvent(event: string, properties?: Record<string, any>) {
  if (!event || typeof event !== 'string') {
    console.error('Invalid event name:', event);
    return false;
  }

  if (properties && typeof properties !== 'object') {
    console.error('Invalid properties:', properties);
    return false;
  }

  return true;
}
```

## Resources

- [Mixpanel JavaScript Documentation](https://docs.mixpanel.com/docs/tracking/reference/javascript)
- [Mixpanel Node.js Documentation](https://docs.mixpanel.com/docs/tracking/reference/nodejs)
- [Event Naming Conventions](https://docs.mixpanel.com/docs/tracking/best-practices/event-naming-conventions)
- [User Profile Properties](https://docs.mixpanel.com/docs/tracking/reference/javascript#setting-profile-properties)
