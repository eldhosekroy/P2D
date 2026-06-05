import * as Sentry from '@sentry/node';

// Initialize Sentry only if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `${process.env.APP_NAME}@${process.env.APP_VERSION}`,
  });
}

export const logger = {
  info: (message: string, data?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...data }));
  },
  warn: (message: string, data?: object) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...data }));
  },
  error: (message: string, error?: any, data?: object) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, stack: error?.stack, ...data }));
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, { extra: { message, ...data } });
    }
  },
};
