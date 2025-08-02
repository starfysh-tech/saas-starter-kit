import { PrismaClient, Prisma } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const create_prisma_client = () => {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });

  // Add performance monitoring in development
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.ENABLE_PERFORMANCE_PROFILING === 'true'
  ) {
    client.$on('query', (e: Prisma.QueryEvent) => {
      const duration = e.duration;
      const query = e.query.slice(0, 100); // Truncate long queries

      if (duration > 100) {
        console.warn(`🐌 Slow Query (${duration}ms): ${query}...`);
      } else if (duration > 50) {
        console.log(`⚠️ Query (${duration}ms): ${query}...`);
      }
    });
  }

  return client;
};

export const prisma = global.prisma || create_prisma_client();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
