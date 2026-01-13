/**
 * @fileoverview Advanced logging system for the Candy AI installer
 * 
 * This module provides comprehensive logging capabilities, including:
 * - Multiple log levels (trace, debug, info, warn, error, fatal)
 * - Console and file logging
 * - Timestamp and context information
 * - Formatted output for better readability
 * - Log rotation to manage file size
 * 
 * @module logger
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

/**
 * Log levels with numeric values for comparison
 * @enum {number}
 */
const LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  NONE: 6
};

/**
 * Color codes for console output
 * @enum {string}
 */
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  TRACE: '\x1b[90m',    // Gray
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[32m',     // Green
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  FATAL: '\x1b[35m',    // Magenta
  TIMESTAMP: '\x1b[90m' // Gray
};

/**
 * Default logger configuration
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO,
  enableConsole: true,
  enableFile: true,
  colorize: true,
  timestamp: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  logFilePath: null,
  format: '[{timestamp}] [{level}] {message}'
};

/**
 * @class Logger
 * @description Core logger class that handles all logging operations
 */
class Logger {
  /**
   * Creates a new Logger instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = [];
    this.isProcessing = false;
    this.logFile = null;
    this.fileSize = 0;
    this.logRotation = 0;
    
    try {
      this._initializeLogFile();
    } catch (error) {
      console.error(`Failed to initialize log file: ${error.message}`);
      this.config.enableFile = false;
    }
  }

  /**
   * Initializes the log file for file logging
   * @private
   * @throws {Error} If the log file cannot be created or accessed
   */
  _initializeLogFile() {
    if (!this.config.enableFile) return;
    
    // In browser environment, we'll use localStorage for logs
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Initialize localStorage log storage if it doesn't exist
      if (!localStorage.getItem('installer_logs')) {
        localStorage.setItem('installer_logs', JSON.stringify([]));
      }
      return;
    }
    
    // In Node.js environment, we'll use the file system
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Create log directory if it doesn't exist
        const logDir = this.config.logFilePath ? 
          path.dirname(this.config.logFilePath) : 
          path.join(process.env.TEMP || '/tmp', 'candy-ai-logs');
        
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Set default log file path if not provided
        if (!this.config.logFilePath) {
          this.config.logFilePath = path.join(logDir, 'installer.log');
        }
        
        // Check if log file exists and get its size
        if (fs.existsSync(this.config.logFilePath)) {
          const stats = fs.statSync(this.config.logFilePath);
          this.fileSize = stats.size;
          
          // Rotate log if needed
          if (this.fileSize >= this.config.maxFileSize) {
            this._rotateLogFile();
          }
        }
        
        // Open log file for appending
        this.logFile = fs.openSync(this.config.logFilePath, 'a');
      } catch (error) {
        throw new Error(`Failed to initialize log file: ${error.message}`);
      }
    }
  }

  /**
   * Rotates log files when the current log file exceeds the maximum size
   * @private
   */
  _rotateLogFile() {
    if (typeof require === 'undefined') return;
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Close current log file if open
      if (this.logFile) {
        fs.closeSync(this.logFile);
        this.logFile = null;
      }
      
      // Shift log files, removing the oldest if maxFiles is reached
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldPath = `${this.config.logFilePath}.${i}`;
        const newPath = `${this.config.logFilePath}.${i + 1}`;
        
        if (fs.existsSync(oldPath)) {
          if (i === this.config.maxFiles - 1) {
            fs.unlinkSync(oldPath); // Remove oldest log file
          } else {
            fs.renameSync(oldPath, newPath);
          }
        }
      }
      
      // Rename current log file
      if (fs.existsSync(this.config.logFilePath)) {
        fs.renameSync(this.config.logFilePath, `${this.config.logFilePath}.1`);
      }
      
      // Create new log file
      this.logFile = fs.openSync(this.config.logFilePath, 'a');
      this.fileSize = 0;
    } catch (error) {
      console.error(`Failed to rotate log file: ${error.message}`);
      this.config.enableFile = false;
    }
  }

  /**
   * Adds a log entry to the queue
   * @private
   * @param {string} level - Log level name
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context data
   */
  _addToQueue(level, message, context = {}) {
    // Skip if the log level is below the configured level
    if (LOG_LEVELS[level] < this.config.level) {
      return;
    }
    
    this.queue.push({
      level,
      message,
      context,
      timestamp: new Date()
    });
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this._processQueue();
    }
  }

  /**
   * Processes the log queue
   * @private
   */
  _processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const entry = this.queue.shift();
    
    try {
      this._logEntry(entry);
    } catch (error) {
      console.error(`Logging error: ${error.message}`);
    }
    
    // Continue processing queue
    setTimeout(() => this._processQueue(), 0);
  }

  /**
   * Formats a log entry according to the configured format
   * @private
   * @param {Object} entry - Log entry object
   * @returns {string} Formatted log message
   */
  _formatEntry(entry) {
    let formatted = this.config.format;
    
    // Replace placeholders in the format string
    formatted = formatted.replace('{timestamp}', entry.timestamp.toISOString());
    formatted = formatted.replace('{level}', entry.level.padEnd(5));
    formatted = formatted.replace('{message}', entry.message);
    
    // Add context data if present
    if (Object.keys(entry.context).length > 0) {
      try {
        const contextStr = JSON.stringify(entry.context);
        formatted += ` ${contextStr}`;
      } catch (error) {
        formatted += ` [Error serializing context: ${error.message}]`;
      }
    }
    
    return formatted;
  }

  /**
   * Colorizes a log entry for console output
   * @private
   * @param {string} level - Log level name
   * @param {string} message - Formatted log message
   * @returns {string} Colorized log message
   */
  _colorize(level, message) {
    if (!this.config.colorize) {
      return message;
    }
    
    // Add color based on log level
    const levelColor = COLORS[level] || COLORS.RESET;
    
    // Colorize timestamp if present
    let colorized = message;
    if (this.config.timestamp) {
      colorized = colorized.replace(
        /\[(.*?)\]/,
        `[${COLORS.TIMESTAMP}$1${COLORS.RESET}]`
      );
    }
    
    // Colorize level
    colorized = colorized.replace(
      new RegExp(`\\[${level.padEnd(5)}\\]`),
      `[${levelColor}${level.padEnd(5)}${COLORS.RESET}]`
    );
    
    return colorized;
  }

  /**
   * Logs an entry to the configured outputs
   * @private
   * @param {Object} entry - Log entry object
   */
  _logEntry(entry) {
    const formatted = this._formatEntry(entry);
    
    // Console logging
    if (this.config.enableConsole) {
      const colorized = this._colorize(entry.level, formatted);
      
      switch (entry.level) {
        case 'TRACE':
        case 'DEBUG':
          console.debug(colorized);
          break;
        case 'INFO':
          console.info(colorized);
          break;
        case 'WARN':
          console.warn(colorized);
          break;
        case 'ERROR':
        case 'FATAL':
          console.error(colorized);
          break;
        default:
          console.log(colorized);
      }
    }
    
    // File logging
    if (this.config.enableFile) {
      // In browser environment, use localStorage
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
          const logs = JSON.parse(localStorage.getItem('installer_logs') || '[]');
          logs.push({
            level: entry.level,
            message: entry.message,
            context: entry.context,
            timestamp: entry.timestamp.toISOString()
          });
          
          // Limit the number of logs stored
          while (logs.length > 1000) {
            logs.shift();
          }
          
          localStorage.setItem('installer_logs', JSON.stringify(logs));
        } catch (error) {
          console.error(`Failed to write to localStorage: ${error.message}`);
        }
        return;
      }
      
      // In Node.js environment, write to file
      if (this.logFile) {
        try {
          const fs = require('fs');
          const data = `${formatted}\n`;
          fs.writeSync(this.logFile, data);
          this.fileSize += data.length;
          
          // Rotate log file if needed
          if (this.fileSize >= this.config.maxFileSize) {
            this._rotateLogFile();
          }
        } catch (error) {
          console.error(`Failed to write to log file: ${error.message}`);
          this.config.enableFile = false;
        }
      }
    }
  }

  /**
   * Logs a message at TRACE level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context data
   */
  trace(message, context = {}) {
    this._addToQueue('TRACE', message, context);
  }

  /**
   * Logs a message at DEBUG level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context data
   */
  debug(message, context = {}) {
    this._addToQueue('DEBUG', message, context);
  }

  /**
   * Logs a message at INFO level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context data
   */
  info(message, context = {}) {
    this._addToQueue('INFO', message, context);
  }

  /**
   * Logs a message at WARN level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context data
   */
  warn(message, context = {}) {
    this._addToQueue('WARN', message, context);
  }

  /**
   * Logs a message at ERROR level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context data
   */
  error(message, context = {}) {
    this._addToQueue('ERROR', message, context);
  }

  /**
   * Logs a message at FATAL level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context data
   */
  fatal(message, context = {}) {
    this._addToQueue('FATAL', message, context);
  }

  /**
   * Sets the log level
   * @param {string|number} level - Log level name or value
   * @throws {Error} If the log level is invalid
   */
  setLevel(level) {
    if (typeof level === 'string') {
      if (!(level in LOG_LEVELS)) {
        throw new Error(`Invalid log level: ${level}`);
      }
      this.config.level = LOG_LEVELS[level];
    } else if (typeof level === 'number') {
      if (level < 0 || level > Object.keys(LOG_LEVELS).length - 1) {
        throw new Error(`Invalid log level value: ${level}`);
      }
      this.config.level = level;
    } else {
      throw new Error(`Invalid log level type: ${typeof level}`);
    }
  }

  /**
   * Enables or disables console logging
   * @param {boolean} enabled - Whether console logging is enabled
   */
  setConsoleLogging(enabled) {
    this.config.enableConsole = Boolean(enabled);
  }

  /**
   * Enables or disables file logging
   * @param {boolean} enabled - Whether file logging is enabled
   */
  setFileLogging(enabled) {
    const wasEnabled = this.config.enableFile;
    this.config.enableFile = Boolean(enabled);
    
    // Initialize log file if newly enabled
    if (!wasEnabled && this.config.enableFile) {
      try {
        this._initializeLogFile();
      } catch (error) {
        console.error(`Failed to initialize log file: ${error.message}`);
        this.config.enableFile = false;
      }
    }
  }

  /**
   * Sets the log file path
   * @param {string} path - Path to the log file
   * @throws {Error} If the log file cannot be created or accessed
   */
  setLogFilePath(path) {
    if (!path) {
      throw new Error('Log file path cannot be empty');
    }
    
    this.config.logFilePath = path;
    
    // Re-initialize log file with new path
    if (this.config.enableFile) {
      try {
        // Close current log file if open
        if (this.logFile) {
          const fs = require('fs');
          fs.closeSync(this.logFile);
          this.logFile = null;
        }
        
        this._initializeLogFile();
      } catch (error) {
        throw new Error(`Failed to set log file path: ${error.message}`);
      }
    }
  }

  /**
   * Gets all logs stored in localStorage (browser only)
   * @returns {Array} Array of log entries
   */
  getStoredLogs() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('installer_logs') || '[]');
      } catch (error) {
        console.error(`Failed to get stored logs: ${error.message}`);
        return [];
      }
    }
    return [];
  }

  /**
   * Clears all logs stored in localStorage (browser only)
   */
  clearStoredLogs() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        localStorage.setItem('installer_logs', JSON.stringify([]));
      } catch (error) {
        console.error(`Failed to clear stored logs: ${error.message}`);
      }
    }
  }

  /**
   * Closes the logger and flushes any pending logs
   */
  close() {
    // Process any remaining logs in the queue
    while (this.queue.length > 0) {
      const entry = this.queue.shift();
      try {
        this._logEntry(entry);
      } catch (error) {
        console.error(`Logging error during close: ${error.message}`);
      }
    }
    
    // Close log file if open
    if (this.logFile && typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        fs.closeSync(this.logFile);
        this.logFile = null;
      } catch (error) {
        console.error(`Failed to close log file: ${error.message}`);
      }
    }
  }
}

// Create a default logger instance
const defaultLogger = new Logger();

// Export the logger
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Logger,
    LOG_LEVELS,
    defaultLogger,
    // Convenience methods for the default logger
    trace: (message, context) => defaultLogger.trace(message, context),
    debug: (message, context) => defaultLogger.debug(message, context),
    info: (message, context) => defaultLogger.info(message, context),
    warn: (message, context) => defaultLogger.warn(message, context),
    error: (message, context) => defaultLogger.error(message, context),
    fatal: (message, context) => defaultLogger.fatal(message, context)
  };
} else if (typeof window !== 'undefined') {
  window.Logger = {
    create: (config) => new Logger(config),
    createLogger: (name) => new Logger({ component: name }),
    instance: defaultLogger,
    LOG_LEVELS,
    trace: (message, context) => defaultLogger.trace(message, context),
    debug: (message, context) => defaultLogger.debug(message, context),
    info: (message, context) => defaultLogger.info(message, context),
    warn: (message, context) => defaultLogger.warn(message, context),
    error: (message, context) => defaultLogger.error(message, context),
    fatal: (message, context) => defaultLogger.fatal(message, context)
  };
  
  // Also make logger available as global variable
  window.logger = defaultLogger;
}