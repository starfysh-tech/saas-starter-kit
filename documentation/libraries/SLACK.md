# Slack Integration Guide

Slack integration provides internal notifications and alerts for team activities, system events, and monitoring within this SaaS application.

## Overview

Slack integration enables:
- Internal team notifications for system events
- Error alerts and monitoring notifications
- User activity alerts (registrations, subscriptions)
- Automated status updates and reports
- Custom webhook notifications

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#notifications
SLACK_BOT_NAME=SaaS Bot
SLACK_ICON_EMOJI=:robot_face:
```

### Slack Webhook Setup

1. Go to your Slack workspace
2. Navigate to Apps > Incoming Webhooks
3. Click "Add to Slack"
4. Choose the channel for notifications
5. Copy the Webhook URL

## Implementation

### Slack Utility Functions

Create `lib/slack.ts`:

```typescript
interface SlackMessage {
  channel?: string
  username?: string
  icon_emoji?: string
  text?: string
  attachments?: SlackAttachment[]
  blocks?: SlackBlock[]
}

interface SlackAttachment {
  color?: 'good' | 'warning' | 'danger' | string
  pretext?: string
  title?: string
  title_link?: string
  text?: string
  fields?: SlackField[]
  footer?: string
  footer_icon?: string
  ts?: number
}

interface SlackField {
  title: string
  value: string
  short?: boolean
}

interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
  }
  elements?: any[]
}

class SlackNotifier {
  private webhookUrl: string
  private defaultChannel: string
  private defaultUsername: string
  private defaultIcon: string

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || ''
    this.defaultChannel = process.env.SLACK_CHANNEL || '#notifications'
    this.defaultUsername = process.env.SLACK_BOT_NAME || 'SaaS Bot'
    this.defaultIcon = process.env.SLACK_ICON_EMOJI || ':robot_face:'
  }

  private async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured')
      return false
    }

    try {
      const payload = {
        channel: message.channel || this.defaultChannel,
        username: message.username || this.defaultUsername,
        icon_emoji: message.icon_emoji || this.defaultIcon,
        ...message,
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.error('Slack notification failed:', response.statusText)
        return false
      }

      return true
    } catch (error) {
      console.error('Slack notification error:', error)
      return false
    }
  }

  async sendText(text: string, channel?: string): Promise<boolean> {
    return this.sendMessage({
      text,
      channel,
    })
  }

  async sendError(error: Error, context?: Record<string, any>): Promise<boolean> {
    const fields: SlackField[] = [
      {
        title: 'Error Message',
        value: error.message,
        short: true,
      },
      {
        title: 'Stack Trace',
        value: error.stack?.substring(0, 500) || 'N/A',
        short: false,
      },
    ]

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        fields.push({
          title: key,
          value: String(value),
          short: true,
        })
      })
    }

    return this.sendMessage({
      attachments: [
        {
          color: 'danger',
          title: '🚨 Application Error',
          fields,
          footer: 'Error Alert System',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  }

  async sendUserRegistration(user: {
    name?: string
    email: string
    plan?: string
  }): Promise<boolean> {
    return this.sendMessage({
      attachments: [
        {
          color: 'good',
          title: '👋 New User Registration',
          fields: [
            {
              title: 'Name',
              value: user.name || 'Not provided',
              short: true,
            },
            {
              title: 'Email',
              value: user.email,
              short: true,
            },
            {
              title: 'Plan',
              value: user.plan || 'Free',
              short: true,
            },
          ],
          footer: 'User Management System',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  }

  async sendSubscriptionUpdate(data: {
    userEmail: string
    plan: string
    action: 'subscribed' | 'upgraded' | 'downgraded' | 'cancelled'
    amount?: number
  }): Promise<boolean> {
    const colors = {
      subscribed: 'good',
      upgraded: 'good', 
      downgraded: 'warning',
      cancelled: 'danger',
    }

    const emojis = {
      subscribed: '💳',
      upgraded: '⬆️',
      downgraded: '⬇️',
      cancelled: '❌',
    }

    const fields: SlackField[] = [
      {
        title: 'User',
        value: data.userEmail,
        short: true,
      },
      {
        title: 'Plan',
        value: data.plan,
        short: true,
      },
    ]

    if (data.amount) {
      fields.push({
        title: 'Amount',
        value: `$${data.amount}`,
        short: true,
      })
    }

    return this.sendMessage({
      attachments: [
        {
          color: colors[data.action],
          title: `${emojis[data.action]} Subscription ${data.action.charAt(0).toUpperCase() + data.action.slice(1)}`,
          fields,
          footer: 'Billing System',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  }

  async sendSystemAlert(alert: {
    title: string
    message: string
    severity: 'info' | 'warning' | 'critical'
    metadata?: Record<string, any>
  }): Promise<boolean> {
    const colors = {
      info: '#36a3eb',
      warning: 'warning',
      critical: 'danger',
    }

    const emojis = {
      info: 'ℹ️',
      warning: '⚠️', 
      critical: '🚨',
    }

    const fields: SlackField[] = []

    if (alert.metadata) {
      Object.entries(alert.metadata).forEach(([key, value]) => {
        fields.push({
          title: key,
          value: String(value),
          short: true,
        })
      })
    }

    return this.sendMessage({
      attachments: [
        {
          color: colors[alert.severity],
          title: `${emojis[alert.severity]} ${alert.title}`,
          text: alert.message,
          fields,
          footer: 'System Monitoring',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })
  }

  async sendDailyReport(data: {
    newUsers: number
    activeUsers: number
    revenue: number
    errors: number
  }): Promise<boolean> {
    return this.sendMessage({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Daily Report',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Here\'s your daily summary:*',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *New Users:* ${data.newUsers}\n• *Active Users:* ${data.activeUsers}\n• *Revenue:* $${data.revenue}\n• *Errors:* ${data.errors}`,
          },
        },
      ],
    })
  }
}

export const slack = new SlackNotifier()
```

## Usage Examples

### Error Notifications

```typescript
import { slack } from '@/lib/slack'

// In API routes or error boundaries
try {
  // Some operation that might fail
  await riskyOperation()
} catch (error) {
  // Send error to Slack
  await slack.sendError(error as Error, {
    'API Route': '/api/users',
    'User ID': userId,
    'Timestamp': new Date().toISOString(),
  })
  
  throw error // Re-throw for proper error handling
}
```

### User Activity Notifications

```typescript
import { slack } from '@/lib/slack'

// When a user registers
export async function handleUserRegistration(user: User) {
  await slack.sendUserRegistration({
    name: user.name,
    email: user.email,
    plan: 'Free',
  })
}

// When subscription changes
export async function handleSubscriptionChange(
  user: User,
  subscription: Subscription
) {
  await slack.sendSubscriptionUpdate({
    userEmail: user.email,
    plan: subscription.plan,
    action: 'subscribed',
    amount: subscription.amount,
  })
}
```

### System Monitoring

```typescript
import { slack } from '@/lib/slack'

// Database connection issues
export async function notifyDatabaseIssue(error: Error) {
  await slack.sendSystemAlert({
    title: 'Database Connection Issue',
    message: 'Unable to connect to the database',
    severity: 'critical',
    metadata: {
      'Error': error.message,
      'Service': 'PostgreSQL',
      'Environment': process.env.NODE_ENV,
    },
  })
}

// High memory usage
export async function notifyHighMemoryUsage(usage: number) {
  await slack.sendSystemAlert({
    title: 'High Memory Usage',
    message: `Memory usage is at ${usage}%`,
    severity: usage > 90 ? 'critical' : 'warning',
    metadata: {
      'Memory Usage': `${usage}%`,
      'Threshold': '80%',
    },
  })
}
```

## Integration with Next.js API Routes

### User Registration Webhook

```typescript
// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { slack } from '@/lib/slack'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, password } = req.body

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })

    // Send Slack notification
    await slack.sendUserRegistration({
      name: user.name,
      email: user.email,
    })

    res.status(201).json({ user })
  } catch (error) {
    // Send error notification
    await slack.sendError(error as Error, {
      'API Route': '/api/auth/register',
      'Request Body': JSON.stringify(req.body),
    })

    res.status(500).json({ error: 'Registration failed' })
  }
}
```

### Stripe Webhook Integration

```typescript
// pages/api/webhooks/stripe.ts
import { slack } from '@/lib/slack'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const event = req.body

  switch (event.type) {
    case 'customer.subscription.created':
      await slack.sendSubscriptionUpdate({
        userEmail: event.data.object.customer.email,
        plan: event.data.object.items.data[0].price.nickname,
        action: 'subscribed',
        amount: event.data.object.items.data[0].price.unit_amount / 100,
      })
      break

    case 'customer.subscription.updated':
      await slack.sendSubscriptionUpdate({
        userEmail: event.data.object.customer.email,
        plan: event.data.object.items.data[0].price.nickname,
        action: 'upgraded',
        amount: event.data.object.items.data[0].price.unit_amount / 100,
      })
      break

    case 'customer.subscription.deleted':
      await slack.sendSubscriptionUpdate({
        userEmail: event.data.object.customer.email,
        plan: 'Cancelled',
        action: 'cancelled',
      })
      break
  }

  res.status(200).json({ received: true })
}
```

## Scheduled Notifications

### Daily Reports

```typescript
// pages/api/cron/daily-report.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { slack } from '@/lib/slack'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron job authorization
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get metrics
    const [newUsers, activeUsers, revenue, errors] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: yesterday,
          },
        },
      }),
      // Calculate revenue from subscriptions
      0, // Implement based on your billing system
      // Count errors from logs
      0, // Implement based on your error tracking
    ])

    await slack.sendDailyReport({
      newUsers,
      activeUsers,
      revenue,
      errors,
    })

    res.status(200).json({ success: true })
  } catch (error) {
    await slack.sendError(error as Error, {
      'Cron Job': 'daily-report',
    })

    res.status(500).json({ error: 'Report generation failed' })
  }
}
```

### Setup Cron Job (Vercel)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Custom Slack Commands

### Team Management

```typescript
// Custom function for team-related notifications
export async function notifyTeamActivity(activity: {
  type: 'member_added' | 'member_removed' | 'role_changed'
  teamName: string
  userEmail: string
  actorEmail: string
  details?: string
}) {
  const emojis = {
    member_added: '➕',
    member_removed: '➖',
    role_changed: '🔄',
  }

  const titles = {
    member_added: 'Team Member Added',
    member_removed: 'Team Member Removed',
    role_changed: 'Team Role Changed',
  }

  await slack.sendMessage({
    attachments: [
      {
        color: activity.type === 'member_removed' ? 'warning' : 'good',
        title: `${emojis[activity.type]} ${titles[activity.type]}`,
        fields: [
          {
            title: 'Team',
            value: activity.teamName,
            short: true,
          },
          {
            title: 'User',
            value: activity.userEmail,
            short: true,
          },
          {
            title: 'Action by',
            value: activity.actorEmail,
            short: true,
          },
          ...(activity.details ? [{
            title: 'Details',
            value: activity.details,
            short: false,
          }] : []),
        ],
        footer: 'Team Management',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}
```

## Testing Slack Integration

### Test Utilities

```typescript
// tests/helpers/slack.ts
import { slack } from '@/lib/slack'

// Mock Slack for testing
export const mockSlack = {
  sendText: jest.fn().mockResolvedValue(true),
  sendError: jest.fn().mockResolvedValue(true),
  sendUserRegistration: jest.fn().mockResolvedValue(true),
  sendSubscriptionUpdate: jest.fn().mockResolvedValue(true),
  sendSystemAlert: jest.fn().mockResolvedValue(true),
}

// Replace slack instance in tests
jest.mock('@/lib/slack', () => ({
  slack: mockSlack,
}))
```

### Integration Tests

```typescript
// tests/slack.test.ts
import { slack } from '@/lib/slack'

describe('Slack Integration', () => {
  beforeEach(() => {
    // Setup test environment variables
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
  })

  it('should send user registration notification', async () => {
    const result = await slack.sendUserRegistration({
      name: 'Test User',
      email: 'test@example.com',
      plan: 'Pro',
    })

    expect(result).toBe(true)
  })

  it('should handle errors gracefully', async () => {
    // Remove webhook URL to simulate failure
    delete process.env.SLACK_WEBHOOK_URL

    const result = await slack.sendText('Test message')

    expect(result).toBe(false)
  })
})
```

## Security Considerations

### Webhook URL Protection

```typescript
// Validate webhook URL format
function validateWebhookUrl(url: string): boolean {
  return url.startsWith('https://hooks.slack.com/services/')
}

// Environment validation
if (process.env.SLACK_WEBHOOK_URL && 
    !validateWebhookUrl(process.env.SLACK_WEBHOOK_URL)) {
  console.warn('Invalid Slack webhook URL format')
}
```

### Rate Limiting

```typescript
// Simple rate limiting for Slack notifications
class RateLimitedSlackNotifier extends SlackNotifier {
  private lastSent: Map<string, number> = new Map()
  private rateLimitMs: number = 60000 // 1 minute

  protected async sendMessage(message: SlackMessage): Promise<boolean> {
    const key = JSON.stringify(message)
    const now = Date.now()
    const lastSentTime = this.lastSent.get(key)

    if (lastSentTime && now - lastSentTime < this.rateLimitMs) {
      console.log('Slack message rate limited')
      return false
    }

    const result = await super.sendMessage(message)
    
    if (result) {
      this.lastSent.set(key, now)
    }

    return result
  }
}
```

## Resources

- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Slack Message Formatting](https://api.slack.com/reference/surfaces/formatting)
- [Slack API Documentation](https://api.slack.com/)