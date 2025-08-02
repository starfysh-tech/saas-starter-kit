import { performance } from 'perf_hooks';

// Performance monitoring utilities for server-side profiling
export class PerformanceProfiler {
  private static timers = new Map<string, number>();
  private static enabled =
    process.env.NODE_ENV === 'development' ||
    process.env.ENABLE_PERFORMANCE_PROFILING === 'true';

  static start_timer(label: string): void {
    if (!this.enabled) return;
    this.timers.set(label, performance.now());
  }

  static end_timer(label: string): number | null {
    if (!this.enabled) return null;

    const start_time = this.timers.get(label);
    if (!start_time) {
      console.warn(`Timer "${label}" was not started`);
      return null;
    }

    const duration = performance.now() - start_time;
    this.timers.delete(label);

    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T;
  static measure<T>(label: string, fn: () => Promise<T>): Promise<T>;
  static measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    if (!this.enabled) return fn();

    this.start_timer(label);
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        this.end_timer(label);
      });
    } else {
      this.end_timer(label);
      return result;
    }
  }

  static async profile_database_query<T>(
    query_name: string,
    query_fn: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) return query_fn();

    const start_time = performance.now();
    try {
      const result = await query_fn();
      const duration = performance.now() - start_time;

      if (duration > 100) {
        // Log slow queries (>100ms)
        console.warn(
          `🐌 Slow DB Query - ${query_name}: ${duration.toFixed(2)}ms`
        );
      } else {
        console.log(`🗄️ DB Query - ${query_name}: ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start_time;
      console.error(
        `❌ DB Query Failed - ${query_name}: ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  }

  static log_request_timing(req: any, res: any, next: any) {
    if (!this.enabled) return next();

    const start_time = performance.now();
    const original_end = res.end;

    res.end = function (chunk: any, encoding: any) {
      const duration = performance.now() - start_time;
      const method = req.method;
      const url = req.url;
      const status = res.statusCode;

      const emoji = status >= 400 ? '❌' : status >= 300 ? '🔄' : '✅';
      console.log(
        `${emoji} ${method} ${url} - ${status} (${duration.toFixed(2)}ms)`
      );

      original_end.call(this, chunk, encoding);
    };

    next();
  }
}

// React component performance hook - disabled for build
export function use_performance_profiler() {
  if (typeof window === 'undefined') return;
  // Implementation disabled to fix build issues
}

// Web Vitals monitoring
export function setup_web_vitals_monitoring() {
  if (typeof window === 'undefined') return;

  // Import web-vitals dynamically with proper error handling
  // Using any type to handle optional dependency
  import('web-vitals' as any)
    .then((webVitals: any) => {
      if (
        webVitals &&
        webVitals.onCLS &&
        webVitals.onFID &&
        webVitals.onFCP &&
        webVitals.onLCP &&
        webVitals.onTTFB
      ) {
        const { onCLS, onFID, onFCP, onLCP, onTTFB } = webVitals;
        onCLS(console.log);
        onFID(console.log);
        onFCP(console.log);
        onLCP(console.log);
        onTTFB(console.log);
      }
    })
    .catch((error: unknown) => {
      console.log(
        'web-vitals not available - install with: npm install web-vitals',
        error
      );
    });
}
