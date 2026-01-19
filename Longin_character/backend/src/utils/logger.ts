/**
 * Logger utility for Longin Character Backend
 * Provides structured logging with Winston
 * @module utils/logger
 */

import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(metadata).length > 0)
    {
        log += ` ${JSON.stringify(metadata)}`;
    }

    if (stack)
    {
        log += `\n${stack}`;
    }

    return log;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    defaultMeta: { service: 'longin-character' },
    transports: [
        // Console transport with colors
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            )
        }),
        // File transport for errors
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Create a child logger with context
export const createChildLogger = (context: string): winston.Logger => {
    return logger.child({ context });
};

// Helper methods for structured logging
export const logError = (message: string, error?: Error, metadata?: Record<string, unknown>): void => {
    logger.error(message, { error: error?.message, stack: error?.stack, ...metadata });
};

export const logInfo = (message: string, metadata?: Record<string, unknown>): void => {
    logger.info(message, metadata);
};

export const logDebug = (message: string, metadata?: Record<string, unknown>): void => {
    logger.debug(message, metadata);
};

export const logWarn = (message: string, metadata?: Record<string, unknown>): void => {
    logger.warn(message, metadata);
};

export default logger;
