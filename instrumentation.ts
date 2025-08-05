// instrumentation.ts

import * as Sentry from '@sentry/nextjs';

export function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' 
        ? 0.1 
        : parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE ?? '1.0'),
      debug: process.env.NODE_ENV === 'development',
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

export const onRequestError = Sentry.captureRequestError;
