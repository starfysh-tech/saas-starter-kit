# Performance Profiling Guide

This guide covers comprehensive performance profiling strategies for the SaaS Starter Kit to identify slow responses in page loads, login, and other operations.

## 🚀 Quick Start

### Enable Performance Monitoring

Add to your `.env` file:

```bash
# Enable performance profiling in production
ENABLE_PERFORMANCE_PROFILING=true

# Sentry performance monitoring
NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE=0.1

# OpenTelemetry (OTEL) monitoring
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=your-endpoint
OTEL_EXPORTER_OTLP_METRICS_HEADERS=your-headers
OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/protobuf
```

### Add Performance Monitor to Your App

```tsx
// pages/_app.tsx
import { PerformanceMonitor } from '@/components/shared/PerformanceMonitor';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <PerformanceMonitor />
    </>
  );
}
```

## 📊 Monitoring Layers

### 1. Server-Side API Performance

#### Real-time API Monitoring

```bash
# View performance stats (development only)
curl http://localhost:4002/api/debug/performance
```

#### Database Query Profiling

- Automatic slow query detection (>100ms)
- Query logging in development mode
- Memory usage tracking

#### Example API Route with Profiling

```typescript
// pages/api/example.ts
import { PerformanceProfiler } from '@/lib/performance';

export default async function handler(req, res) {
  const result = await PerformanceProfiler.measure('user-fetch', async () => {
    return await get_user(req.body.id);
  });

  res.json(result);
}
```

### 2. Database Performance

#### Prisma Query Monitoring

The enhanced Prisma client automatically logs:

- Query execution time
- Slow queries (>100ms) with warnings
- Query text (truncated for readability)

#### Manual Database Profiling

```typescript
import { PerformanceProfiler, prisma } from '@/lib';

const profile_user_creation = async (email: string) => {
  return await PerformanceProfiler.profile_database_query('create-user', () =>
    prisma.user.create({ data: { email } })
  );
};
```

### 3. Client-Side Performance

#### Core Web Vitals Monitoring

Automatically tracks:

- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

#### Component Performance Monitoring

```tsx
import {
  use_component_performance,
  with_performance_monitoring,
} from '@/components/shared/PerformanceMonitor';

// Hook approach
function MyComponent() {
  use_component_performance('MyComponent');
  return <div>Content</div>;
}

// HOC approach
const MonitoredComponent = with_performance_monitoring(
  MyComponent,
  'MyComponent'
);
```

## 🔍 Common Performance Issues & Solutions

### Slow Page Loads

#### 1. Check Next.js Build Analysis

```bash
npm run build
# Look for large bundle sizes in the output
```

#### 2. Analyze Bundle Size

```bash
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

#### 3. Monitor Page Load Times

- Check browser DevTools Network tab
- Use Lighthouse for comprehensive audits
- Monitor LCP and FCP metrics

### Slow Login Performance

#### 1. Database Query Optimization

```typescript
// Check for N+1 queries in authentication
await PerformanceProfiler.profile_database_query('auth-user', async () => {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true, // Make sure this is necessary
      sessions: true, // Consider if you need this
    },
  });
});
```

#### 2. NextAuth.js Performance

- Enable database sessions for better performance
- Optimize JWT strategy vs database strategy
- Consider session storage optimization

#### 3. Password Hashing Performance

```typescript
// Monitor bcrypt performance
const hash_password = async (password: string) => {
  return await PerformanceProfiler.measure('password-hash', () => {
    return bcrypt.hash(password, 12); // Consider reducing rounds if too slow
  });
};
```

### API Route Performance

#### 1. Identify Slow Endpoints

```bash
# Check performance dashboard
curl http://localhost:4002/api/debug/performance
```

#### 2. Database Connection Pooling

```typescript
// lib/prisma.ts - Already configured with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5&pool_timeout=2',
    },
  },
});
```

#### 3. Add Caching

```typescript
import { cache } from 'react';

// Server-side caching for expensive operations
export const get_cached_team_data = cache(async (team_id: string) => {
  return await PerformanceProfiler.measure('team-data-fetch', () => {
    return prisma.team.findUnique({
      where: { id: team_id },
      include: { members: true },
    });
  });
});
```

## 🛠️ Advanced Profiling Tools

### 1. Node.js Profiler

```bash
# CPU profiling
node --prof server.js

# Memory profiling
node --inspect server.js
```

### 2. Chrome DevTools

- Performance tab for client-side profiling
- Network tab for request analysis
- Lighthouse for comprehensive audits

### 3. Production Monitoring

#### Sentry Performance Monitoring

```typescript
// Automatic transaction tracking
import * as Sentry from '@sentry/nextjs';

Sentry.startTransaction({
  name: 'user-login',
  op: 'authentication',
});
```

#### Custom Metrics with OTEL

```typescript
import { recordMetric } from '@/lib/metrics';

// Track custom business metrics
recordMetric('user.login.success');
recordMetric('user.login.failure');
```

## 📈 Performance Benchmarks

### Target Performance Goals

- **Page Load**: < 2 seconds
- **Login Process**: < 1 second
- **API Responses**: < 500ms
- **Database Queries**: < 100ms
- **LCP**: < 2.5 seconds
- **FID**: < 100ms
- **CLS**: < 0.1

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Test login endpoint
artillery run --config load-test-config.json
```

Example load test config:

```yaml
# load-test-config.json
config:
  target: 'http://localhost:4002'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Login Flow'
    flow:
      - post:
          url: '/api/auth/signin'
          json:
            email: 'test@example.com'
            password: 'password'
```

## 🚨 Performance Alerts

### Set up Monitoring Alerts

- Database query time > 200ms
- API response time > 1000ms
- Page load time > 3000ms
- Memory usage > 80%
- Error rate > 5%

### Automated Performance Testing

```bash
# Add to CI/CD pipeline
npm run build
npm run test:performance  # Custom performance test suite
```

## 🔧 Performance Debugging Workflow

1. **Identify the Issue**

   - Use browser DevTools
   - Check server logs
   - Review performance dashboard

2. **Isolate the Bottleneck**

   - Profile specific functions
   - Monitor database queries
   - Check network requests

3. **Optimize**

   - Database query optimization
   - Code splitting and lazy loading
   - Caching strategies
   - Bundle size reduction

4. **Verify**
   - Run performance tests
   - Monitor in production
   - Validate with real users

## 📚 Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Performance Profiling](https://reactjs.org/docs/optimizing-performance.html)
