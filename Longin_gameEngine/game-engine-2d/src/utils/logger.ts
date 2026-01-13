
/**
 * Logger wrapper that supports both Node.js (via Winston) and Browser (via Console).
 * Provides static methods for logging at different levels (info, warn, error, debug).
 */
export class Logger {
  private static isBrowser: boolean = typeof window !== 'undefined' && typeof document !== 'undefined';
  private static winstonLogger: any = null;

  /**
   * Initializes the logger.
   * In Node.js, it initializes Winston.
   * In Browser, it does nothing (Console is always available).
   */
  public static initialize(): void {
    if (Logger.isBrowser) {
      // Browser environment - no setup needed
      return;
    }

    // Node.js environment - Lazy load winston to avoid bundling it for browser
    if (!Logger.winstonLogger) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const winston = require('winston');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');

        const logFormat = winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          }),
        );

        Logger.winstonLogger = winston.createLogger({
          level: process.env.LOG_LEVEL || 'info',
          format: logFormat,
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            }),
            new winston.transports.File({
              filename: path.join('logs', 'error.log'),
              level: 'error',
            }),
            new winston.transports.File({ filename: path.join('logs', 'combined.log') }),
          ],
        });
      } catch (e) {
        console.warn('Failed to initialize Winston logger in Node environment:', e);
      }
    }
  }

  /**
   * Logs an informational message.
   */
  public static info(message: string, meta?: any): void {
    if (Logger.isBrowser) {
      console.info(`[INFO] ${message}`, meta || '');
    } else {
      if (!Logger.winstonLogger) Logger.initialize();
      Logger.winstonLogger?.info(message, meta);
    }
  }

  /**
   * Logs a warning message.
   */
  public static warn(message: string, meta?: any): void {
    if (Logger.isBrowser) {
      console.warn(`[WARN] ${message}`, meta || '');
    } else {
      if (!Logger.winstonLogger) Logger.initialize();
      Logger.winstonLogger?.warn(message, meta);
    }
  }

  /**
   * Logs an error message.
   */
  public static error(message: string, error?: Error, meta?: any): void {
    if (Logger.isBrowser) {
      console.error(`[ERROR] ${message}`, error, meta || '');
    } else {
      if (!Logger.winstonLogger) Logger.initialize();
      Logger.winstonLogger?.error(message, { error: error?.message, stack: error?.stack, ...meta });
    }
  }

  /**
   * Logs a debug message.
   */
  public static debug(message: string, meta?: any): void {
    if (Logger.isBrowser) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    } else {
      if (!Logger.winstonLogger) Logger.initialize();
      Logger.winstonLogger?.debug(message, meta);
    }
  }
}
