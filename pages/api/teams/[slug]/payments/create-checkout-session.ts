import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/lib/session';
import { throwIfNoTeamAccess } from 'models/team';
import { stripe, getStripeCustomerId } from '@/lib/stripe';
import env from '@/lib/env';
import { checkoutSessionSchema, validateWithSchema } from '@/lib/zod';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        action: 'create_checkout_session',
        endpoint: 'stripe_checkout',
      },
    });
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: 'Create Stripe Checkout Session',
    },
    async (span) => {
      const { price, quantity } = validateWithSchema(
        checkoutSessionSchema,
        req.body
      );

      span.setAttribute('priceId', price);
      span.setAttribute('quantity', quantity);

      const teamMember = await throwIfNoTeamAccess(req, res);
      const session = await getSession(req, res);
      const customer = await getStripeCustomerId(teamMember, session);

      span.setAttribute('teamId', teamMember.team.id);
      span.setAttribute('teamSlug', teamMember.team.slug);
      span.setAttribute('customerId', customer);

      const checkoutSession = await stripe.checkout.sessions.create({
        customer,
        mode: 'subscription',
        line_items: [
          {
            price,
            quantity,
          },
        ],

        // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
        // the actual Session ID is returned in the query parameter when your customer
        // is redirected to the success page.

        success_url: `${env.appUrl}/teams/${teamMember.team.slug}/billing`,
        cancel_url: `${env.appUrl}/teams/${teamMember.team.slug}/billing`,
      });

      span.setAttribute('checkoutSessionId', checkoutSession.id);

      res.json({ data: checkoutSession });
    }
  );
};
