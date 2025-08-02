import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import type { NextApiRequest, NextApiResponse } from 'next';
import env from '@/lib/env';
import type { Readable } from 'node:stream';
import {
  createStripeSubscription,
  deleteStripeSubscription,
  getBySubscriptionId,
  updateStripeSubscription,
} from 'models/subscription';
import { getByCustomerId } from 'models/team';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Get raw body as string
async function getRawBody(readable: Readable): Promise<Buffer> {
  const chunks: any[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const relevantEvents: Stripe.Event.Type[] = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  const rawBody = await getRawBody(req);

  const sig = req.headers['stripe-signature'] as string;
  const { webhookSecret } = env.stripe;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      return;
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    Sentry.captureException(err, {
      tags: {
        action: 'webhook_verification',
        endpoint: 'stripe',
      },
    });
    return res.status(400).json({ error: { message: err.message } });
  }

  if (relevantEvents.includes(event.type)) {
    try {
      await Sentry.startSpan(
        {
          op: 'webhook.stripe',
          name: `Stripe Webhook: ${event.type}`,
        },
        async (span) => {
          span.setAttribute('eventType', event.type);
          span.setAttribute('eventId', event.id);

          switch (event.type) {
            case 'customer.subscription.created':
              await handleSubscriptionCreated(event);
              break;
            case 'customer.subscription.updated':
              await handleSubscriptionUpdated(event);
              break;
            case 'customer.subscription.deleted': {
              const subscription = event.data.object as Stripe.Subscription;
              span.setAttribute('subscriptionId', subscription.id);
              await deleteStripeSubscription(subscription.id);
              break;
            }
            default:
              throw new Error('Unhandled relevant event!');
          }
        }
      );
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          action: 'webhook_handler',
          endpoint: 'stripe',
          event_type: event.type,
        },
      });
      return res.status(400).json({
        error: {
          message: 'Webhook handler failed. View your nextjs function logs.',
        },
      });
    }
  }
  return res.status(200).json({ received: true });
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  return Sentry.startSpan(
    {
      op: 'db.update',
      name: 'Update Stripe Subscription',
    },
    async (span) => {
      const {
        cancel_at,
        id,
        status,
        current_period_end,
        current_period_start,
        customer,
        items,
      } = event.data.object as Stripe.Subscription;

      span.setAttribute('subscriptionId', id);
      span.setAttribute('customerId', customer as string);
      span.setAttribute('status', status);

      const subscription = await getBySubscriptionId(id);
      if (!subscription) {
        const teamExists = await getByCustomerId(customer as string);
        if (!teamExists) {
          return;
        } else {
          await handleSubscriptionCreated(event);
        }
      } else {
        const priceId = items.data.length > 0 ? items.data[0].plan?.id : '';
        //type Stripe.Subscription.Status = "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid"
        await updateStripeSubscription(id, {
          active: status === 'active',
          endDate: current_period_end
            ? new Date(current_period_end * 1000)
            : undefined,
          startDate: current_period_start
            ? new Date(current_period_start * 1000)
            : undefined,
          cancelAt: cancel_at ? new Date(cancel_at * 1000) : undefined,
          priceId,
        });
      }
    }
  );
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  return Sentry.startSpan(
    {
      op: 'db.create',
      name: 'Create Stripe Subscription',
    },
    async (span) => {
      const { customer, id, current_period_start, current_period_end, items } =
        event.data.object as Stripe.Subscription;

      span.setAttribute('subscriptionId', id);
      span.setAttribute('customerId', customer as string);
      span.setAttribute(
        'priceId',
        items.data.length > 0 ? items.data[0].plan?.id || '' : ''
      );

      await createStripeSubscription({
        customerId: customer as string,
        id,

        active: true,
        startDate: new Date(current_period_start * 1000),
        endDate: new Date(current_period_end * 1000),
        priceId: items.data.length > 0 ? items.data[0].plan?.id : '',
      });
    }
  );
}
