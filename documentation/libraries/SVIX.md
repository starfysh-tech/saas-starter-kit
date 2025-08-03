# Svix Webhook Orchestration Documentation

## Overview

Svix is integrated into this SaaS starter kit to provide enterprise-grade webhook orchestration. It handles webhook delivery, retries, security, and monitoring for your application's webhook events.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Svix Configuration
SVIX_API_KEY=sk_your_api_key_here
SVIX_URL=https://api.svix.com  # or https://api.eu.svix.com for EU

# Feature Flag
FEATURE_TEAM_WEBHOOK=true
```

### Initial Setup

1. **Create Svix Account**

   - Visit [svix.com](https://www.svix.com/) and create an account
   - Choose between hosted SaaS or self-hosted options

2. **Get API Key**

   - Navigate to your Svix dashboard
   - Create a new API key with appropriate permissions
   - Copy the key (starts with `sk_`)

3. **Configure Feature Flag**
   - Set `FEATURE_TEAM_WEBHOOK=true` to enable webhook functionality

## Implementation Details

### Core Files

- `lib/svix.ts` - Svix client configuration and wrapper functions
- `pages/api/teams/[slug]/webhooks/` - Webhook management API endpoints
- `components/webhook/` - Webhook management UI components
- `hooks/useWebhook.ts` - React hooks for webhook operations

### Architecture Pattern

#### Multi-Tenant Structure

```
Organization/Team → Svix Application → Webhook Endpoints
```

Each team gets its own Svix application for isolated webhook management.

#### Key Concepts

- **Applications**: One per customer/team
- **Endpoints**: Webhook URLs for each customer
- **Messages**: Individual webhook events sent
- **Event Types**: Categories of webhook events

### Core Functions

#### Application Management

```typescript
// Create or find team's webhook application
export const findOrCreateApp = async (name: string, uid: string) => {
  return await svix?.application.getOrCreate({ name, uid });
};
```

#### Endpoint Management

```typescript
// Create webhook endpoint
export const createWebhook = async (appId: string, data: EndpointIn) => {
  return await svix?.endpoint.create(appId, data);
};

// Update existing endpoint
export const updateWebhook = async (
  appId: string,
  endpointId: string,
  data: EndpointIn
) => {
  return await svix?.endpoint.update(appId, endpointId, data);
};
```

#### Event Sending

```typescript
// Send webhook event
export const sendEvent = async (
  appId: string,
  eventType: AppEvent,
  payload: Record<string, unknown>
) => {
  await createEventType(eventType);
  return await svix?.message.create(appId, {
    eventType,
    payload: {
      event: eventType,
      data: payload,
    },
  });
};
```

## Usage Examples

### Creating a Webhook Endpoint

```typescript
// POST /api/teams/[slug]/webhooks
const webhook = await createWebhook(appId, {
  description: 'My webhook endpoint',
  url: 'https://example.com/webhooks',
  version: 1,
  filterTypes: ['user.created', 'user.updated'],
});
```

### Sending Events

```typescript
// Trigger webhook events
await sendEvent(appId, 'user.created', {
  id: user.id,
  email: user.email,
  created_at: user.createdAt,
});
```

### Managing Endpoints

```typescript
// List all webhooks for a team
const webhooks = await listWebhooks(appId);

// Update webhook configuration
await updateWebhook(appId, endpointId, {
  description: 'Updated webhook',
  url: 'https://example.com/new-webhook',
  filterTypes: ['user.created'],
});
```

## Webhook Delivery & Retries

### Automatic Retry Schedule

1. **Immediate**: First delivery attempt
2. **5 seconds**: After first failure
3. **5 minutes**: After second failure
4. **30 minutes**: After third failure
5. **2 hours**: After fourth failure
6. **5 hours**: After fifth failure
7. **10 hours**: After sixth failure
8. **10 hours**: Final attempt

### Success Criteria

- HTTP status codes 200-299 indicate success
- Response received within 15 seconds
- Any other status code triggers retry

### Failure Handling

- Endpoints disabled after 5 days of consecutive failures
- Failed messages stored in dead letter queue
- Manual retry available from customer portal
- Operational webhooks notify about failures

## Security Implementation

### Signature Verification

All webhooks include HMAC signatures for verification:

```typescript
import { Webhook } from 'svix';

// In your webhook receiver
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const webhook = new Webhook(process.env.SVIX_ENDPOINT_SECRET!);

  try {
    const payload = webhook.verify(JSON.stringify(req.body), req.headers);

    // Process verified webhook
    console.log('Verified webhook:', payload);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid signature' });
  }
}
```

### Security Best Practices

- **HTTPS Required**: All webhook URLs must use HTTPS in production
- **Signature Verification**: Always verify webhook signatures
- **Timestamp Validation**: Check message freshness (5-minute tolerance)
- **Unique Secrets**: Each endpoint has its own secret key
- **Raw Payload**: Use exact request body for verification

## Testing & Debugging

### Local Development

```bash
# Use Svix Play for local testing
# Visit: https://play.svix.com/

# Test with curl
curl -X POST https://play.svix.com/in/e_test_123/ \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook payload"}'
```

### Testing Checklist

- [ ] Signature verification works correctly
- [ ] Endpoint returns proper HTTP status codes
- [ ] Response time under 15 seconds
- [ ] Handles malformed payloads gracefully
- [ ] Retry mechanism behaves as expected

### Common Issues

**Signature Verification Failures**

- Ensure using raw request body (not parsed JSON)
- Check correct endpoint secret is used
- Verify proper header extraction

**Delivery Failures**

- Confirm HTTPS URL for production
- Check response times and status codes
- Verify endpoint is publicly accessible

## Event Types

### Pre-defined Events

The starter kit includes these event types:

- `user.created`
- `user.updated`
- `user.deleted`
- `team.created`
- `team.updated`
- `team.member.added`
- `team.member.removed`

### Custom Events

Add new event types as needed:

```typescript
await createEventType('subscription.updated');
await sendEvent(appId, 'subscription.updated', {
  subscription_id: 'sub_123',
  status: 'active',
  updated_at: new Date().toISOString(),
});
```

## Customer Portal

### Embedded Portal

Svix provides a customer portal for webhook management:

```typescript
// Generate portal access URL
const portalUrl = await svix?.authentication.appPortalAccess(appId, {
  featureFlags: ['self-serve'],
});
```

### Portal Features

- Webhook endpoint management
- Event log inspection
- Retry failed messages
- Download webhook attempts
- Real-time webhook debugging

## Monitoring & Analytics

### Built-in Metrics

- Webhook delivery success rates
- Average response times
- Failed delivery counts
- Endpoint health status

### Integration with Your App

```typescript
// Track webhook metrics
await recordMetric('webhook.sent', {
  team_id: team.id,
  event_type: eventType,
  endpoint_count: endpoints.length,
});
```

## Production Deployment

### Pre-Launch Checklist

- [ ] Switch to production Svix API key
- [ ] Verify all webhook URLs use HTTPS
- [ ] Test webhook signature verification
- [ ] Configure monitoring and alerting
- [ ] Set up customer portal access
- [ ] Document webhook payload schemas

### Monitoring Setup

- Monitor webhook delivery success rates
- Set up alerts for high failure rates
- Track response time performance
- Review customer portal usage

## Troubleshooting

### Common Issues

**Webhooks Not Delivering**

- Check endpoint URL accessibility
- Verify HTTPS requirement
- Review Svix dashboard for error details
- Check endpoint response codes

**Signature Verification Errors**

- Confirm using raw request body
- Verify correct endpoint secret
- Check timestamp tolerance settings

**Performance Issues**

- Monitor endpoint response times
- Implement proper error handling
- Consider webhook queuing for heavy processing

### Support Resources

- [Svix Documentation](https://docs.svix.com)
- [Community Discord](https://discord.gg/svix)
- [GitHub Repository](https://github.com/svix/svix-webhooks)
- [Status Page](https://status.svix.com)

## Related Files

- `lib/svix.ts:1` - Core Svix integration
- `pages/api/teams/[slug]/webhooks/index.ts:1` - Webhook API endpoints
- `components/webhook/Webhooks.tsx:1` - Webhook management UI
- `hooks/useWebhooks.ts:1` - React hooks for webhook operations
