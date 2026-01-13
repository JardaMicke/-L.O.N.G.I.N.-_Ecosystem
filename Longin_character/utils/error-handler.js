/**
 * @fileoverview Enhanced error handling system for the Candy AI installer
 * 
 * This module provides comprehensive error handling capabilities, including:
 * - Custom error types with detailed information
 * - Error categorization and classification
 * - Error reporting and logging
 * - Recovery strategies and fallbacks
 * - User-friendly error messages
 * 
 * @module error-handler
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

/**
 * Error types for categorization
 * @enum {string}
 */
const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  FILESYSTEM: 'filesystem',
  DEPENDENCY: 'dependency',
  PERMISSION: 'permission',
  CONFIGURATION: 'configuration',
  EXECUTION: 'execution',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 * @enum {string}
 */
const ERROR_SEVERITY = {
  FATAL: 'fatal',      // Application cannot continue
  ERROR: 'error',      // Serious problem, but application can continue
  WARNING: 'warning',  // Minor issue, operation can continue
  INFO: 'info'         // Informational message, not an error
};

/**
 * Error recovery strategies
 * @enum {string}
 */
const RECOVERY_STRATEGIES = {
  RETRY: 'retry',              // Try the operation again
  ALTERNATE_SOURCE: 'alternate', // Try an alternative source
  SKIP: 'skip',                // Skip the operation and continue
  ROLLBACK: 'rollback',        // Roll back to a previous state
  PROMPT_USER: 'prompt',       // Ask the user for input
  ABORT: 'abort'               // Abort the entire operation
};

/**
 * @class InstallerError
 * @extends Error
 * @description Custom error class for installer-specific errors
 */
class InstallerError extends Error {
  /**
   * Creates a new InstallerError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {string} options.type - Error type from ERROR_TYPES
   * @param {string} options.severity - Error severity from ERROR_SEVERITY
   * @param {string} options.code - Error code
   * @param {string} options.component - Component where the error occurred
   * @param {string} options.operation - Operation that failed
   * @param {Error} options.cause - Original error that caused this error
   * @param {Object} options.data - Additional data related to the error
   * @param {Array<string>} options.recoveryStrategies - Possible recovery strategies
   */
  constructor(message, options = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.type = options.type || ERROR_TYPES.UNKNOWN;
    this.severity = options.severity || ERROR_SEVERITY.ERROR;
    this.code = options.code || 'ERR_UNKNOWN';
    this.component = options.component || 'installer';
    this.operation = options.operation || 'unknown';
    this.cause = options.cause || null;
    this.data = options.data || {};
    this.recoveryStrategies = options.recoveryStrategies || [];
    this.timestamp = new Date();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Gets a user-friendly error message
   * @returns {string} User-friendly error message
   */
  getUserMessage() {
    // Generate a user-friendly message based on the error properties
    const messages = {
      [ERROR_TYPES.VALIDATION]: 'Došlo k chybě při ověřování vstupních dat.',
      [ERROR_TYPES.NETWORK]: 'Došlo k chybě při síťové komunikaci.',
      [ERROR_TYPES.FILESYSTEM]: 'Došlo k chybě při práci se soubory.',
      [ERROR_TYPES.DEPENDENCY]: 'Došlo k chybě při práci s závislostmi.',
      [ERROR_TYPES.PERMISSION]: 'Nemáte dostatečná oprávnění pro tuto operaci.',
      [ERROR_TYPES.CONFIGURATION]: 'Došlo k chybě v konfiguraci.',
      [ERROR_TYPES.EXECUTION]: 'Došlo k chybě při provádění operace.',
      [ERROR_TYPES.UNKNOWN]: 'Došlo k neznámé chybě.'
    };
    
    // Start with the basic message for the error type
    let userMessage = messages[this.type] || messages[ERROR_TYPES.UNKNOWN];
    
    // Add operation-specific context
    if (this.operation !== 'unknown') {
      userMessage += ` Chyba nastala při: ${this.operation}.`;
    }
    
    // Add specific error details
    userMessage += ` ${this.message}`;
    
    // Add recovery suggestions for user-actionable errors
    if (this.recoveryStrategies.includes(RECOVERY_STRATEGIES.PROMPT_USER)) {
      switch (this.type) {
        case ERROR_TYPES.PERMISSION:
          userMessage += ' Zkuste spustit instalátor s administrátorskými právy.';
          break;
        case ERROR_TYPES.FILESYSTEM:
          userMessage += ' Zkontrolujte, zda máte přístup k uvedeným souborům a dostatek místa na disku.';
          break;
        case ERROR_TYPES.NETWORK:
          userMessage += ' Zkontrolujte své připojení k internetu a zkuste to znovu.';
          break;
        case ERROR_TYPES.DEPENDENCY:
          userMessage += ' Zkuste ručně nainstalovat chybějící závislost a zkuste to znovu.';
          break;
        default:
          break;
      }
    }
    
    return userMessage;
  }

  /**
   * Serializes the error to a plain object
   * @returns {Object} Plain object representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      component: this.component,
      operation: this.operation,
      cause: this.cause ? (this.cause.message || String(this.cause)) : null,
      data: this.data,
      recoveryStrategies: this.recoveryStrategies,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }

  /**
   * Creates an error from a plain object
   * @param {Object} json - Plain object representation of the error
   * @returns {InstallerError} New error instance
   */
  static fromJSON(json) {
    const error = new InstallerError(json.message, {
      type: json.type,
      severity: json.severity,
      code: json.code,
      component: json.component,
      operation: json.operation,
      cause: json.cause ? new Error(json.cause) : null,
      data: json.data,
      recoveryStrategies: json.recoveryStrategies
    });
    
    error.timestamp = new Date(json.timestamp);
    error.stack = json.stack;
    
    return error;
  }
}

/**
 * @class ValidationError
 * @extends InstallerError
 * @description Error for validation failures
 */
class ValidationError extends InstallerError {
  /**
   * Creates a new ValidationError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.VALIDATION,
      code: 'ERR_VALIDATION',
      ...options
    });
  }
}

/**
 * @class NetworkError
 * @extends InstallerError
 * @description Error for network failures
 */
class NetworkError extends InstallerError {
  /**
   * Creates a new NetworkError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.NETWORK,
      code: 'ERR_NETWORK',
      ...options
    });
  }
}

/**
 * @class FilesystemError
 * @extends InstallerError
 * @description Error for filesystem operations
 */
class FilesystemError extends InstallerError {
  /**
   * Creates a new FilesystemError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.FILESYSTEM,
      code: 'ERR_FILESYSTEM',
      ...options
    });
  }
}

/**
 * @class DependencyError
 * @extends InstallerError
 * @description Error for dependency issues
 */
class DependencyError extends InstallerError {
  /**
   * Creates a new DependencyError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.DEPENDENCY,
      code: 'ERR_DEPENDENCY',
      ...options
    });
  }
}

/**
 * @class PermissionError
 * @extends InstallerError
 * @description Error for permission issues
 */
class PermissionError extends InstallerError {
  /**
   * Creates a new PermissionError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.PERMISSION,
      code: 'ERR_PERMISSION',
      ...options
    });
  }
}

/**
 * @class ConfigurationError
 * @extends InstallerError
 * @description Error for configuration issues
 */
class ConfigurationError extends InstallerError {
  /**
   * Creates a new ConfigurationError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.CONFIGURATION,
      code: 'ERR_CONFIGURATION',
      ...options
    });
  }
}

/**
 * @class ExecutionError
 * @extends InstallerError
 * @description Error for execution failures
 */
class ExecutionError extends InstallerError {
  /**
   * Creates a new ExecutionError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      type: ERROR_TYPES.EXECUTION,
      code: 'ERR_EXECUTION',
      ...options
    });
  }
}

/**
 * @class ErrorHandler
 * @description Manages error handling, reporting, and recovery
 */
class ErrorHandler {
  /**
   * Creates a new ErrorHandler instance
   * @param {Object} options - Handler options
   * @param {Object} options.logger - Logger instance
   * @param {Function} options.onError - Error callback function
   * @param {boolean} options.captureUnhandledErrors - Whether to capture unhandled errors
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.onError = options.onError || null;
    this.errors = [];
    this.lastError = null;
    
    // Set up global error handlers if requested
    if (options.captureUnhandledErrors !== false) {
      this._setupGlobalHandlers();
    }
  }

  /**
   * Sets up global error handlers
   * @private
   */
  _setupGlobalHandlers() {
    // In browser environment
    if (typeof window !== 'undefined') {
      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), {
          operation: 'unhandled_error',
          data: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
        
        // Don't prevent the default error handling
        return false;
      });
      
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? 
          event.reason : new Error(String(event.reason));
        
        this.handleError(error, {
          operation: 'unhandled_rejection',
          data: { promise: event.promise }
        });
        
        // Don't prevent the default error handling
        return false;
      });
    }
    
    // In Node.js environment
    if (typeof process !== 'undefined') {
      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        this.handleError(error, {
          operation: 'uncaught_exception'
        });
        
        // Exit gracefully
        process.exit(1);
      });
      
      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        const error = reason instanceof Error ?
          reason : new Error(String(reason));
        
        this.handleError(error, {
          operation: 'unhandled_rejection',
          data: { promise }
        });
      });
    }
  }

  /**
   * Handles an error by wrapping, logging, and optionally reporting it
   * @param {Error} error - The error to handle
   * @param {Object} options - Error handling options
   * @param {string} options.component - Component where the error occurred
   * @param {string} options.operation - Operation that failed
   * @param {Object} options.data - Additional data related to the error
   * @param {boolean} options.log - Whether to log the error
   * @param {boolean} options.report - Whether to report the error
   * @returns {InstallerError} Wrapped error
   */
  handleError(error, options = {}) {
    // Default options
    const {
      component = 'installer',
      operation = 'unknown',
      data = {},
      log = true,
      report = true
    } = options;
    
    // Wrap the error if it's not already an InstallerError
    let wrappedError;
    if (error instanceof InstallerError) {
      wrappedError = error;
    } else {
      // Map error types based on native error types or messages
      let errorType = ERROR_TYPES.UNKNOWN;
      let errorCode = 'ERR_UNKNOWN';
      let recoveryStrategies = [];
      
      if (error instanceof TypeError || error instanceof SyntaxError || error instanceof RangeError) {
        errorType = ERROR_TYPES.VALIDATION;
        errorCode = `ERR_${error.name.toUpperCase()}`;
        recoveryStrategies = [RECOVERY_STRATEGIES.ABORT];
      } else if (error instanceof URIError || error.message.match(/fetch|network|connection|timeout/i)) {
        errorType = ERROR_TYPES.NETWORK;
        errorCode = 'ERR_NETWORK';
        recoveryStrategies = [RECOVERY_STRATEGIES.RETRY, RECOVERY_STRATEGIES.ALTERNATE_SOURCE];
      } else if (error.message.match(/EACCES|permission|denied/i)) {
        errorType = ERROR_TYPES.PERMISSION;
        errorCode = 'ERR_PERMISSION';
        recoveryStrategies = [RECOVERY_STRATEGIES.PROMPT_USER];
      } else if (error.message.match(/ENOENT|no such file|not found|file|directory/i)) {
        errorType = ERROR_TYPES.FILESYSTEM;
        errorCode = 'ERR_FILESYSTEM';
        recoveryStrategies = [RECOVERY_STRATEGIES.RETRY, RECOVERY_STRATEGIES.ALTERNATE_SOURCE];
      } else if (error.message.match(/dependency|module|package|require|import/i)) {
        errorType = ERROR_TYPES.DEPENDENCY;
        errorCode = 'ERR_DEPENDENCY';
        recoveryStrategies = [RECOVERY_STRATEGIES.RETRY, RECOVERY_STRATEGIES.ALTERNATE_SOURCE];
      } else if (error.message.match(/config|configuration|setting/i)) {
        errorType = ERROR_TYPES.CONFIGURATION;
        errorCode = 'ERR_CONFIGURATION';
        recoveryStrategies = [RECOVERY_STRATEGIES.ROLLBACK];
      } else if (error.message.match(/exec|spawn|command|process/i)) {
        errorType = ERROR_TYPES.EXECUTION;
        errorCode = 'ERR_EXECUTION';
        recoveryStrategies = [RECOVERY_STRATEGIES.RETRY, RECOVERY_STRATEGIES.SKIP];
      }
      
      // Create a new InstallerError with mapped properties
      wrappedError = new InstallerError(error.message, {
        type: errorType,
        code: errorCode,
        component,
        operation,
        cause: error,
        data,
        recoveryStrategies
      });
    }
    
    // Store the error
    this.lastError = wrappedError;
    this.errors.push(wrappedError);
    
    // Log the error
    if (log) {
      this._logError(wrappedError);
    }
    
    // Report the error
    if (report && this.onError) {
      try {
        this.onError(wrappedError);
      } catch (reportError) {
        // Log error in error handler, but don't recurse
        this.logger.error(`Error in error handler: ${reportError.message}`);
      }
    }
    
    return wrappedError;
  }

  /**
   * Logs an error with appropriate level and details
   * @param {InstallerError} error - The error to log
   * @private
   */
  _logError(error) {
    const logContext = {
      errorType: error.type,
      errorCode: error.code,
      component: error.component,
      operation: error.operation,
      timestamp: error.timestamp.toISOString(),
      recoveryStrategies: error.recoveryStrategies
    };
    
    // Add data if present
    if (Object.keys(error.data).length > 0) {
      logContext.data = error.data;
    }
    
    // Add cause if present
    if (error.cause) {
      logContext.cause = error.cause.message || String(error.cause);
      
      // Add stack trace for debugging
      if (error.cause.stack) {
        logContext.causeStack = error.cause.stack;
      }
    }
    
    // Log with appropriate level based on severity
    switch (error.severity) {
      case ERROR_SEVERITY.FATAL:
        this.logger.error(`FATAL: ${error.message}`, logContext);
        break;
      case ERROR_SEVERITY.ERROR:
        this.logger.error(error.message, logContext);
        break;
      case ERROR_SEVERITY.WARNING:
        this.logger.warn(error.message, logContext);
        break;
      case ERROR_SEVERITY.INFO:
        this.logger.info(error.message, logContext);
        break;
      default:
        this.logger.error(error.message, logContext);
    }
  }

  /**
   * Creates and handles a validation error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @returns {ValidationError} The created and handled error
   */
  validation(message, options = {}) {
    const error = new ValidationError(message, options);
    return this.handleError(error, options);
  }

  /**
   * Creates and handles a network error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @returns {NetworkError} The created and handled error
   */
  network(message, options = {}) {
    const error = new NetworkError(message, options);
    return this.handleError(error, options);
  }

  /**
   * Creates and handles a filesystem error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @returns {FilesystemError} The created and handled error
   */
  filesystem(message, options = {}) {
    const error = new FilesystemError(message, options);
    return this.handleError(error, options);
  }

  /**
   * Creates and handles a dependency error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @returns {DependencyError} The created and handled error
   */
  dependency(message, options = {}) {
    const error = new DependencyError(message, options);
    return this.handleError(error, options);
  }

  /**
   * Creates and handles a permission error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @returns {PermissionError} The created and handled error
   */
  permission(message, options = {}) {
    const error = new PermissionError(message, options);
    return this.handleError(error, options);
  }

  /**
   * Creates and handles a configuration error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @returns {ConfigurationError} The created and handled error
   */
  configuration(message, options = {}) {
    const error = new ConfigurationError(message, options);
    return this.handleError(error, options);
  }

  /**
   * Creates and handles an execution error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @returns {ExecutionError} The created and handled error
   */
  execution(message, options = {}) {
    const error = new ExecutionError(message, options);
    return this.handleError(error, options);
  }

  /**
   * Gets all errors
   * @returns {Array<InstallerError>} List of all errors
   */
  getAllErrors() {
    return [...this.errors];
  }

  /**
   * Gets the last error
   * @returns {InstallerError|null} Last error or null if no errors
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Clears all stored errors
   */
  clearErrors() {
    this.errors = [];
    this.lastError = null;
  }

  /**
   * Wraps a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Error handling options
   * @returns {Function} Wrapped function
   */
  wrap(fn, options = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleError(error, {
          ...options,
          data: { ...options.data, args }
        });
      }
    };
  }

  /**
   * Executes a function with retry capability
   * @param {Function} fn - Function to execute
   * @param {Object} options - Retry options
   * @param {number} options.maxRetries - Maximum number of retries
   * @param {number} options.retryDelay - Delay between retries in milliseconds
   * @param {Function} options.shouldRetry - Function to determine if retry should be attempted
   * @param {Function} options.onRetry - Function called before each retry
   * @param {Object} options.errorOptions - Options passed to handleError
   * @returns {Promise<*>} Result of the function
   */
  async withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      shouldRetry = () => true,
      onRetry = () => {},
      errorOptions = {}
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error;
        
        // If this was the last attempt, handle the error and throw
        if (attempt > maxRetries || !shouldRetry(error, attempt)) {
          this.handleError(error, errorOptions);
          throw error;
        }
        
        // Log the retry
        this.logger.warn(
          `Retry ${attempt}/${maxRetries} after error: ${error.message}`,
          { error, attempt, maxRetries }
        );
        
        // Call the onRetry callback
        try {
          await onRetry(error, attempt);
        } catch (retryError) {
          this.logger.error(`Error in onRetry callback: ${retryError.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // This should never be reached, but just in case
    this.handleError(lastError, errorOptions);
    throw lastError;
  }
}

// Create a default error handler instance
let defaultErrorHandler;

// Try to import the logger if available
let logger = console;
try {
  if (typeof require !== 'undefined') {
    const loggerModule = require('./logger');
    logger = loggerModule.defaultLogger || console;
  } else if (typeof window !== 'undefined' && window.Logger) {
    logger = window.Logger.instance || console;
  }
} catch (error) {
  // Use console as fallback
  console.warn(`Failed to import logger: ${error.message}`);
}

// Create the default error handler
defaultErrorHandler = new ErrorHandler({ logger });

// Export the module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ErrorHandler,
    InstallerError,
    ValidationError,
    NetworkError,
    FilesystemError,
    DependencyError,
    PermissionError,
    ConfigurationError,
    ExecutionError,
    ERROR_TYPES,
    ERROR_SEVERITY,
    RECOVERY_STRATEGIES,
    defaultErrorHandler,
    // Convenience methods for the default error handler
    handleError: (error, options) => defaultErrorHandler.handleError(error, options),
    validation: (message, options) => defaultErrorHandler.validation(message, options),
    network: (message, options) => defaultErrorHandler.network(message, options),
    filesystem: (message, options) => defaultErrorHandler.filesystem(message, options),
    dependency: (message, options) => defaultErrorHandler.dependency(message, options),
    permission: (message, options) => defaultErrorHandler.permission(message, options),
    configuration: (message, options) => defaultErrorHandler.configuration(message, options),
    execution: (message, options) => defaultErrorHandler.execution(message, options),
    withRetry: (fn, options) => defaultErrorHandler.withRetry(fn, options)
  };
} else if (typeof window !== 'undefined') {
  window.ErrorHandler = {
    create: (options) => new ErrorHandler(options),
    instance: defaultErrorHandler,
    ERROR_TYPES,
    ERROR_SEVERITY,
    RECOVERY_STRATEGIES,
    // Přidat přímé reference na konstruktory chyb
    InstallerError: InstallerError,
    ValidationError: ValidationError,
    NetworkError: NetworkError,
    FilesystemError: FilesystemError,
    DependencyError: DependencyError,
    PermissionError: PermissionError,
    ConfigurationError: ConfigurationError,
    ExecutionError: ExecutionError,
    // Metody pro zpracování chyb
    handleError: (error, options) => defaultErrorHandler.handleError(error, options),
    validation: (message, options) => defaultErrorHandler.validation(message, options),
    network: (message, options) => defaultErrorHandler.network(message, options),
    filesystem: (message, options) => defaultErrorHandler.filesystem(message, options),
    dependency: (message, options) => defaultErrorHandler.dependency(message, options),
    permission: (message, options) => defaultErrorHandler.permission(message, options),
    configuration: (message, options) => defaultErrorHandler.configuration(message, options),
    execution: (message, options) => defaultErrorHandler.execution(message, options),
    withRetry: (fn, options) => defaultErrorHandler.withRetry(fn, options)
  };
}