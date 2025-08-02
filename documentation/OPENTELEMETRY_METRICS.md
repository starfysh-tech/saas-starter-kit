# OpenTelemetry & Metrics Integration Guide

OpenTelemetry provides observability for this SaaS application through metrics, traces, and logs, enabling comprehensive monitoring and performance analysis.

## Overview

OpenTelemetry integration provides:
- Application performance monitoring (APM)
- Custom metrics collection and reporting
- Distributed tracing across services
- Error tracking and performance insights
- Integration with monitoring platforms

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=your-api-key
OTEL_SERVICE_NAME=saas-starter-kit
OTEL_SERVICE_VERSION=1.0.0
OTEL_ENVIRONMENT=development

# Metrics Configuration
ENABLE_METRICS=true
METRICS_ENDPOINT=/api/metrics
METRICS_INTERVAL=30000
```

## Installation & Setup

### Dependencies

```bash
npm install @opentelemetry/api
npm install @opentelemetry/sdk-node
npm install @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-otlp-http
npm install @opentelemetry/instrumentation-http
npm install @opentelemetry/instrumentation-express
npm install @opentelemetry/instrumentation-prisma
```

### OpenTelemetry Initialization

Create `lib/telemetry.ts`:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

// Configure resource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'saas-app',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.OTEL_ENVIRONMENT || 'development',
})

// Configure trace exporter
const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
})

// Configure metric exporter
const metricExporter = new OTLPMetricExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
})

// Configure metric reader
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: parseInt(process.env.METRICS_INTERVAL || '30000'),
})

// Initialize SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation
      },
    }),
  ],
})

// Start SDK
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TELEMETRY === 'true') {
  sdk.start()
  console.log('OpenTelemetry started successfully')
}

function parseHeaders(headersString?: string): Record<string, string> {
  if (!headersString) return {}
  
  const headers: Record<string, string> = {}
  headersString.split(',').forEach(header => {
    const [key, value] = header.split('=')
    if (key && value) {
      headers[key.trim()] = value.trim()
    }
  })
  
  return headers
}

export { sdk }
```

### Metrics Collection

Create `lib/metrics.ts`:

```typescript
import { metrics, trace } from '@opentelemetry/api'

// Get meter instance
const meter = metrics.getMeter('saas-app-metrics', '1.0.0')

// Application metrics
export const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
})

export const requestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'Duration of HTTP requests in milliseconds',
})

export const activeUsers = meter.createUpDownCounter('active_users_total', {
  description: 'Number of currently active users',
})

export const databaseConnections = meter.createUpDownCounter('database_connections_active', {
  description: 'Number of active database connections',
})

export const errorCounter = meter.createCounter('errors_total', {
  description: 'Total number of errors',
})

// Business metrics
export const userRegistrations = meter.createCounter('user_registrations_total', {
  description: 'Total number of user registrations',
})

export const subscriptionChanges = meter.createCounter('subscription_changes_total', {
  description: 'Total number of subscription changes',
})

export const apiKeyUsage = meter.createCounter('api_key_usage_total', {
  description: 'Total number of API key usages',
})

export const teamOperations = meter.createCounter('team_operations_total', {
  description: 'Total number of team operations',
})

// Performance metrics
export const memoryUsage = meter.createObservableGauge('memory_usage_bytes', {
  description: 'Memory usage in bytes',
})

export const cpuUsage = meter.createObservableGauge('cpu_usage_percent', {
  description: 'CPU usage percentage',
})

// Register observable metrics
memoryUsage.addCallback((result) => {
  const used = process.memoryUsage()
  result.observe(used.heapUsed, { type: 'heap' })
  result.observe(used.rss, { type: 'rss' })
})

cpuUsage.addCallback((result) => {
  const startUsage = process.cpuUsage()
  setTimeout(() => {
    const endUsage = process.cpuUsage(startUsage)
    const totalUsage = endUsage.user + endUsage.system
    result.observe(totalUsage / 1000000) // Convert to percentage
  }, 100)
})

// Utility functions for custom metrics
export class MetricsCollector {
  static recordRequest(method: string, route: string, statusCode: number, duration: number) {
    requestCounter.add(1, {
      method,
      route,
      status_code: statusCode.toString(),
    })

    requestDuration.record(duration, {
      method,
      route,
      status_code: statusCode.toString(),
    })
  }

  static recordError(errorType: string, route?: string, userId?: string) {
    errorCounter.add(1, {
      error_type: errorType,
      route: route || 'unknown',
      user_id: userId || 'anonymous',
    })
  }

  static recordUserRegistration(method: 'email' | 'oauth', plan: string) {
    userRegistrations.add(1, {
      method,
      plan,
    })
  }

  static recordSubscriptionChange(action: 'subscribe' | 'upgrade' | 'downgrade' | 'cancel', plan: string) {
    subscriptionChanges.add(1, {
      action,
      plan,
    })
  }

  static recordApiKeyUsage(teamId: string, keyId: string) {
    apiKeyUsage.add(1, {
      team_id: teamId,
      key_id: keyId,
    })
  }

  static recordTeamOperation(operation: 'create' | 'update' | 'delete' | 'member_add' | 'member_remove') {
    teamOperations.add(1, {
      operation,
    })
  }

  static updateActiveUsers(count: number) {
    activeUsers.add(count)
  }

  static updateDatabaseConnections(change: number) {
    databaseConnections.add(change)
  }
}
```

## Middleware Integration

### Next.js API Route Middleware

Create `lib/middleware/telemetry.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { trace, context } from '@opentelemetry/api'
import { MetricsCollector } from '@/lib/metrics'

export function withTelemetry(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const tracer = trace.getTracer('api-routes')
    const startTime = Date.now()

    return tracer.startActiveSpan(`${req.method} ${req.url}`, async (span) => {
      try {
        // Set span attributes
        span.setAttributes({
          'http.method': req.method || 'UNKNOWN',
          'http.url': req.url || '',
          'http.user_agent': req.headers['user-agent'] || '',
          'http.remote_addr': req.socket.remoteAddress || '',
        })

        // Add custom context
        context.with(context.active(), () => {
          span.setAttribute('custom.route', req.url || '')
        })

        await handler(req, res)

        // Record successful request
        const duration = Date.now() - startTime
        MetricsCollector.recordRequest(
          req.method || 'UNKNOWN',
          req.url || '',
          res.statusCode,
          duration
        )

        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response_time_ms': duration,
        })

        span.setStatus({ code: 1 }) // OK
      } catch (error) {
        // Record error
        const duration = Date.now() - startTime
        MetricsCollector.recordError(
          error instanceof Error ? error.constructor.name : 'UnknownError',
          req.url,
          req.headers.authorization ? 'authenticated' : 'anonymous'
        )

        MetricsCollector.recordRequest(
          req.method || 'UNKNOWN',
          req.url || '',
          500,
          duration
        )

        span.recordException(error instanceof Error ? error : new Error(String(error)))
        span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) })

        throw error
      } finally {
        span.end()
      }
    })
  }
}
```

### Usage in API Routes

```typescript
// pages/api/users/index.ts
import { withTelemetry } from '@/lib/middleware/telemetry'
import { MetricsCollector } from '@/lib/metrics'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create user logic
    const user = await createUser(req.body)
    
    // Record business metric
    MetricsCollector.recordUserRegistration('email', 'free')
    
    res.status(201).json(user)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

export default withTelemetry(handler)
```

## Custom Traces

### Database Operations

```typescript
// lib/database/traced-operations.ts
import { trace } from '@opentelemetry/api'
import { prisma } from '@/lib/prisma'
import { MetricsCollector } from '@/lib/metrics'

const tracer = trace.getTracer('database-operations')

export class TracedDatabaseOperations {
  static async findUser(email: string) {
    return tracer.startActiveSpan('db.user.findUnique', async (span) => {
      span.setAttributes({
        'db.operation': 'findUnique',
        'db.table': 'users',
        'db.query.email': email,
      })

      try {
        const user = await prisma.user.findUnique({
          where: { email },
        })

        span.setAttribute('db.result.found', !!user)
        return user
      } catch (error) {
        span.recordException(error instanceof Error ? error : new Error(String(error)))
        MetricsCollector.recordError('DatabaseError', 'user.findUnique')
        throw error
      } finally {
        span.end()
      }
    })
  }

  static async createTeam(data: any, userId: string) {
    return tracer.startActiveSpan('db.team.create', async (span) => {
      span.setAttributes({
        'db.operation': 'create',
        'db.table': 'teams',
        'user.id': userId,
      })

      try {
        const team = await prisma.team.create({
          data: {
            ...data,
            members: {
              create: {
                userId,
                role: 'OWNER',
                accepted: true,
              },
            },
          },
        })

        MetricsCollector.recordTeamOperation('create')
        span.setAttribute('team.id', team.id)
        
        return team
      } catch (error) {
        span.recordException(error instanceof Error ? error : new Error(String(error)))
        MetricsCollector.recordError('DatabaseError', 'team.create')
        throw error
      } finally {
        span.end()
      }
    })
  }
}
```

### External API Calls

```typescript
// lib/external/traced-api.ts
import { trace } from '@opentelemetry/api'
import { MetricsCollector } from '@/lib/metrics'

const tracer = trace.getTracer('external-api')

export class TracedApiClient {
  static async fetchWithTracing(url: string, options: RequestInit = {}) {
    return tracer.startActiveSpan('http.client.request', async (span) => {
      span.setAttributes({
        'http.method': options.method || 'GET',
        'http.url': url,
        'http.client': 'fetch',
      })

      const startTime = Date.now()

      try {
        const response = await fetch(url, options)
        const duration = Date.now() - startTime

        span.setAttributes({
          'http.status_code': response.status,
          'http.response_time_ms': duration,
        })

        if (!response.ok) {
          MetricsCollector.recordError('HttpError', url)
          span.setStatus({ code: 2, message: `HTTP ${response.status}` })
        }

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        
        span.recordException(error instanceof Error ? error : new Error(String(error)))
        span.setAttributes({
          'http.response_time_ms': duration,
        })
        
        MetricsCollector.recordError('NetworkError', url)
        throw error
      } finally {
        span.end()
      }
    })
  }
}
```

## Business Metrics Dashboard

### Metrics API Endpoint

Create `pages/api/metrics/index.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsers24h,
      newUsers7d,
      totalTeams,
      activeTeams,
      totalApiKeys,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: last24Hours } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.team.count(),
      prisma.team.count({
        where: {
          members: {
            some: {
              user: {
                lastActiveAt: { gte: last24Hours },
              },
            },
          },
        },
      }),
      prisma.apiKey.count(),
    ])

    res.status(200).json({
      users: {
        total: totalUsers,
        new24h: newUsers24h,
        new7d: newUsers7d,
      },
      teams: {
        total: totalTeams,
        active: activeTeams,
      },
      apiKeys: {
        total: totalApiKeys,
      },
      timestamp: now.toISOString(),
    })
  } catch (error) {
    MetricsCollector.recordError('MetricsApiError')
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
}
```

### Real-time Metrics Component

```typescript
// components/dashboard/MetricsDashboard.tsx
'use client'
import { useEffect, useState } from 'react'

interface Metrics {
  users: {
    total: number
    new24h: number
    new7d: number
  }
  teams: {
    total: number
    active: number
  }
  apiKeys: {
    total: number
  }
  timestamp: string
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div>Loading metrics...</div>
  }

  if (!metrics) {
    return <div>Failed to load metrics</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Users</h3>
        <div className="space-y-1">
          <p className="text-3xl font-bold">{metrics.users.total}</p>
          <p className="text-sm text-gray-600">
            +{metrics.users.new24h} today, +{metrics.users.new7d} this week
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Teams</h3>
        <div className="space-y-1">
          <p className="text-3xl font-bold">{metrics.teams.total}</p>
          <p className="text-sm text-gray-600">
            {metrics.teams.active} active today
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">API Keys</h3>
        <div className="space-y-1">
          <p className="text-3xl font-bold">{metrics.apiKeys.total}</p>
          <p className="text-sm text-gray-600">Total created</p>
        </div>
      </div>
    </div>
  )
}
```

## Performance Monitoring

### Custom Performance Hooks

```typescript
// hooks/usePerformanceMetrics.ts
import { useEffect } from 'react'
import { MetricsCollector } from '@/lib/metrics'

export function usePerformanceMetrics(pageName: string) {
  useEffect(() => {
    const startTime = performance.now()

    // Record page load
    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      MetricsCollector.recordRequest('GET', pageName, 200, loadTime)
    }

    // Record when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        MetricsCollector.updateActiveUsers(1)
      } else {
        MetricsCollector.updateActiveUsers(-1)
      }
    }

    window.addEventListener('load', handleLoad)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('load', handleLoad)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pageName])
}
```

### Error Boundary with Metrics

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react'
import { MetricsCollector } from '@/lib/metrics'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Record error in metrics
    MetricsCollector.recordError(
      error.name,
      errorInfo.componentStack?.split('\n')[1]?.trim(),
      'frontend-user'
    )

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600">Please refresh the page or contact support</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Integration with External Services

### Honeycomb Integration

```typescript
// lib/honeycomb.ts
import { trace } from '@opentelemetry/api'

export class HoneycombIntegration {
  static addCustomFields(fields: Record<string, any>) {
    const span = trace.getActiveSpan()
    if (span) {
      Object.entries(fields).forEach(([key, value]) => {
        span.setAttribute(`custom.${key}`, value)
      })
    }
  }

  static addUserContext(userId: string, email?: string, plan?: string) {
    const span = trace.getActiveSpan()
    if (span) {
      span.setAttributes({
        'user.id': userId,
        'user.email': email || '',
        'user.plan': plan || '',
      })
    }
  }

  static addTeamContext(teamId: string, teamName: string, memberCount: number) {
    const span = trace.getActiveSpan()
    if (span) {
      span.setAttributes({
        'team.id': teamId,
        'team.name': teamName,
        'team.member_count': memberCount,
      })
    }
  }
}
```

## Testing

### Mock Telemetry for Tests

```typescript
// tests/mocks/telemetry.ts
export const mockTracer = {
  startActiveSpan: jest.fn((name, fn) => {
    return fn({
      setAttributes: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    })
  }),
}

export const mockMetrics = {
  recordRequest: jest.fn(),
  recordError: jest.fn(),
  recordUserRegistration: jest.fn(),
  updateActiveUsers: jest.fn(),
}

jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: () => mockTracer,
    getActiveSpan: () => ({
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
    }),
  },
  metrics: {
    getMeter: () => ({
      createCounter: () => ({ add: jest.fn() }),
      createHistogram: () => ({ record: jest.fn() }),
      createUpDownCounter: () => ({ add: jest.fn() }),
    }),
  },
}))
```

## Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry JavaScript SDK](https://opentelemetry.io/docs/instrumentation/js/)
- [Honeycomb OpenTelemetry Guide](https://docs.honeycomb.io/getting-data-in/opentelemetry/)
- [OTEL Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)