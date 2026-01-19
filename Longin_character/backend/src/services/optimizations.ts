/**
 * Optimizations Service
 * Performance optimizations for the server
 * @module services/optimizations
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const memoryCache = require('memory-cache');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');

/**
 * Sets up server optimizations
 */
export function setupOptimizations (): void {
    // Set memory limits and GC
    setupMemoryLimits();

    // Set unhandled exception handling
    setupUnhandledExceptionHandling();

    console.log('Optimalizace serveru byly nastaveny');
}

/**
 * Sets memory limits and triggers GC if needed
 */
function setupMemoryLimits (): void {
    const maxMemoryUsage = 1024 * 1024 * 1024; // 1GB
    const checkInterval = 60 * 1000; // 1 minute

    setInterval(() => {
        const memoryUsage = process.memoryUsage();

        // Log memory usage if > 80%
        if (memoryUsage.heapUsed > maxMemoryUsage * 0.8)
        {
            console.warn(`Vysoké využití paměti: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(maxMemoryUsage / 1024 / 1024)}MB`);
        }

        // Clear cache and GC if > 90%
        if (memoryUsage.heapUsed > maxMemoryUsage * 0.9)
        {
            memoryCache.clear();

            // Force garbage collection if node-gc is available
            if (global.gc)
            {
                global.gc();
                console.log('Paměť byla vyčištěna a garbage collection byl spuštěn');
            }
        }
    }, checkInterval);
}

/**
 * Sets up unhandled exception handling
 */
function setupUnhandledExceptionHandling (): void {
    process.on('uncaughtException', (error: Error) => {
        console.error('Nezachycená výjimka:', error);
        // Log but don't exit process (risky but requested by original code logic)
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        console.error('Nezachycené odmítnutí promise:', reason);
        // Log but don't exit
    });
}

/**
 * Middleware for caching responses
 * @param duration - Duration in milliseconds
 */
export function cacheMiddleware (duration: number): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip cache for non-GET requests
        if (req.method !== 'GET')
        {
            return next();
        }

        const key = `__cache__${req.originalUrl || req.url}`;
        const cachedBody = memoryCache.get(key);

        if (cachedBody)
        {
            res.send(cachedBody);
            return;
        }

        // Intercept res.send
        const originalSend = res.send;

        // Override res.send to cache
        res.send = function (body: any): Response {
            memoryCache.put(key, body, duration);
            return originalSend.call(this, body);
        };

        next();
    };
}

/**
 * Middleware for rate limiting
 * @param maxRequests - Max requests per window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimitMiddleware (maxRequests: number, windowMs: number): RequestHandler {
    const requests = new Map<string, number[]>();

    // Cleanup old records
    setInterval(() => {
        const now = Date.now();

        for (const [key, timestamps] of requests.entries())
        {
            const filtered = timestamps.filter(timestamp => now - timestamp < windowMs);

            if (filtered.length === 0)
            {
                requests.delete(key);
            } else
            {
                requests.set(key, filtered);
            }
        }
    }, windowMs);

    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `${ip}`;

        if (!requests.has(key))
        {
            requests.set(key, []);
        }

        const timestamps = requests.get(key) || [];
        const now = Date.now();

        // Filter old timestamps
        const recentTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

        if (recentTimestamps.length >= maxRequests)
        {
            res.status(429).json({
                error: {
                    type: 'RATE_LIMIT_ERROR',
                    message: 'Překročen limit požadavků. Zkuste to prosím později.'
                }
            });
            return;
        }

        // Add current timestamp
        recentTimestamps.push(now);
        requests.set(key, recentTimestamps);

        next();
    };
}

/**
 * Middleware for compression
 */
export function compressionMiddleware (): RequestHandler {
    return compression({
        // Filter when to use compression
        filter: (req: Request, res: Response) => {
            // Don't compress small responses
            const contentLength = res.getHeader('Content-Length');
            if (contentLength && typeof contentLength === 'string' && parseInt(contentLength) < 1024)
            {
                return false;
            }

            // Use standard filter
            return compression.filter(req, res);
        },
        // Compression level (6 is default good balance)
        level: 6
    });
}

/**
 * Sanitizes data by removing sensitive fields
 */
export function sanitizeData (data: any): any {
    if (!data) return data;

    // If data is object
    if (typeof data === 'object' && data !== null)
    {
        // Copy for manipulation
        const sanitized: any = Array.isArray(data) ? [...data] : { ...data };

        // Sensitive fields to remove
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'apiSecret', 'api_secret'];

        // Remote sensitive fields
        if (!Array.isArray(sanitized))
        {
            for (const field of sensitiveFields)
            {
                if (field in sanitized)
                {
                    delete sanitized[field];
                }
            }
        }

        // Recursive sanitization
        for (const key in sanitized)
        {
            if (sanitized[key] && typeof sanitized[key] === 'object')
            {
                sanitized[key] = sanitizeData(sanitized[key]);
            }
        }

        return sanitized;
    }

    return data;
}
