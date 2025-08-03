# Stripe Integration Documentation

## Overview

Stripe is integrated into this SaaS starter kit to handle payment processing, subscription management, and billing operations. This document provides setup instructions, configuration details, and implementation guidance.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook Secret (from webhook endpoint configuration)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Initial Setup

1. **Create Stripe Account**

   - Visit [stripe.com](https://stripe.com) and create an account
   - Complete business verification for production use

2. **Get API Keys**

   - Navigate to [Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
   - Copy publishable key and secret key
   - Use test keys for development, live keys for production

3. **Configure Webhook Endpoint**
   - Go to [Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_succeeded`
   - Copy webhook signing secret

## Implementation Details

### Core Files

- `lib/stripe.ts` - Stripe client configuration
- `pages/api/webhooks/stripe.ts` - Webhook handler
- `pages/api/teams/[slug]/payments/` - Payment-related API routes
- `components/billing/` - Payment UI components

### Key Features

#### 1. Subscription Management

- Create and update subscriptions
- Handle billing cycles and invoicing
- Support for multiple pricing tiers
- Automatic subscription renewals

#### 2. Customer Portal

- Self-service billing management
- Update payment methods
- View invoices and payment history
- Cancel or modify subscriptions

#### 3. Webhook Processing

- Real-time payment status updates
- Subscription state synchronization
- Failed payment handling
- Invoice generation notifications

### Testing

#### Local Development

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:4002/api/webhooks/stripe

# Test webhook events
stripe trigger checkout.session.completed
```

#### Test Cards

```
Success: 4242424242424242
Decline: 4000000000000002
3D Secure: 4000002500003155
```

## Usage Examples

### Creating Checkout Session

```typescript
// pages/api/teams/[slug]/payments/create-checkout-session.ts
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  success_url: `${APP_URL}/teams/${team.slug}/billing?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/teams/${team.slug}/billing`,
});
```

### Handling Webhooks

```typescript
// pages/api/webhooks/stripe.ts
switch (event.type) {
  case 'checkout.session.completed':
    await handleSubscriptionCreated(event.data.object);
    break;
  case 'customer.subscription.updated':
    await handleSubscriptionUpdated(event.data.object);
    break;
  case 'invoice.payment_succeeded':
    await handlePaymentSucceeded(event.data.object);
    break;
}
```

### Customer Portal Access

```typescript
// pages/api/teams/[slug]/payments/create-portal-link.ts
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${APP_URL}/teams/${team.slug}/billing`,
});
```

## Best Practices

### Security

- Never expose secret keys to client-side code
- Always verify webhook signatures
- Use HTTPS for all payment-related pages
- Implement idempotency for webhook handlers

### Error Handling

- Implement retry logic for failed webhook events
- Log all payment-related errors for debugging
- Provide clear error messages to users
- Handle network timeouts gracefully

### Database Synchronization

- Keep local subscription state in sync with Stripe
- Use webhooks as the source of truth for payment events
- Implement reconciliation processes for data consistency
- Store minimal payment data locally (refer to Stripe for details)

### Performance

- Cache product and price data locally
- Implement database connection pooling
- Use Stripe's idempotency keys for duplicate prevention
- Monitor webhook processing times

## Production Deployment

### Pre-Launch Checklist

- [ ] Switch to live API keys
- [ ] Configure production webhook endpoints
- [ ] Test all payment flows end-to-end
- [ ] Set up monitoring and alerting
- [ ] Implement proper error logging
- [ ] Verify PCI compliance requirements

### Monitoring

- Track webhook delivery success rates
- Monitor payment failure rates
- Set up alerts for critical payment events
- Review Stripe Dashboard analytics regularly

## Troubleshooting

### Common Issues

**Webhook Verification Failures**

- Verify webhook secret is correct
- Check that raw request body is used for signature verification
- Ensure proper Content-Type handling

**Payment Failures**

- Check Stripe Dashboard for detailed error messages
- Verify customer has valid payment method
- Review subscription status and billing settings

**Subscription Sync Issues**

- Use webhook events to update local database
- Implement reconciliation jobs for data consistency
- Check event processing order and timing

### Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Status Page](https://status.stripe.com)
- [Community Forum](https://support.stripe.com)
- [Integration Examples](https://github.com/stripe-samples)

## Related Files

- `lib/stripe.ts:1` - Stripe client configuration
- `pages/api/webhooks/stripe.ts:1` - Main webhook handler
- `sync-stripe.js:1` - Product synchronization script
- `components/billing/PaymentButton.tsx:1` - Payment UI component
