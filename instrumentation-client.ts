import * as Sentry from '@sentry/nextjs';

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
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      sessionSampleRate: 0.1,
      errorSampleRate: 1.0,
    }),
    Sentry.consoleLoggingIntegration({
      levels: ['log', 'error', 'warn'],
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
