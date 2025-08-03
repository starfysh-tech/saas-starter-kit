// instrumentation.ts

import * as Sentry from '@sentry/nextjs';

export function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: parseFloat(
        process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE ?? '0.0'
      ),
      debug: false,
      _experiments: {
        enableLogs: true,
      },
      integrations: [
        Sentry.consoleLoggingIntegration({
          levels: ['log', 'error', 'warn'],
        }),
      ],
    });
  }
}

export async function onRequestError(err: Error) {
  // TODO: Fix Sentry integration - temporarily disabled due to type mismatch
  console.error('Request error:', err);
}
