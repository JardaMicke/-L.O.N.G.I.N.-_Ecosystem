/**
 * Debug Utilities
 * 
 * A set of debugging tools for development and troubleshooting.
 */

// Constants
const DEBUG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5
};

// Default debug level - can be changed at runtime
let debugLevel = process.env.NODE_ENV === 'production' ? DEBUG_LEVELS.ERROR : DEBUG_LEVELS.DEBUG;

// Namespace specific debug levels
const namespaceSettings = new Map();

/**
 * Set global debug level
 * @param {number} level - Debug level (0-5)
 */
function setDebugLevel(level) {
  if (level >= DEBUG_LEVELS.NONE && level <= DEBUG_LEVELS.TRACE) {
    debugLevel = level;
    console.log(`Debug level set to ${getDebugLevelName(level)}`);
  } else {
    console.error(`Invalid debug level: ${level}. Must be between 0-5.`);
  }
}

/**
 * Set debug level for a specific namespace
 * @param {string} namespace - Debug namespace
 * @param {number} level - Debug level (0-5)
 */
function setNamespaceLevel(namespace, level) {
  if (level >= DEBUG_LEVELS.NONE && level <= DEBUG_LEVELS.TRACE) {
    namespaceSettings.set(namespace, level);
    console.log(`Debug level for ${namespace} set to ${getDebugLevelName(level)}`);
  } else {
    console.error(`Invalid debug level: ${level}. Must be between 0-5.`);
  }
}

/**
 * Get human-readable name for debug level
 * @param {number} level - Debug level
 * @returns {string} Level name
 */
function getDebugLevelName(level) {
  return Object.keys(DEBUG_LEVELS).find(key => DEBUG_LEVELS[key] === level) || 'UNKNOWN';
}

/**
 * Get effective debug level for a namespace
 * @param {string} namespace - Debug namespace
 * @returns {number} Effective debug level
 */
function getEffectiveLevel(namespace) {
  return namespaceSettings.has(namespace) 
    ? namespaceSettings.get(namespace) 
    : debugLevel;
}

/**
 * Create a debug logger for a specific namespace
 * @param {string} namespace - Debug namespace
 * @returns {Object} Debug logger
 */
function createLogger(namespace) {
  const logger = {
    error: (message, ...args) => log(namespace, DEBUG_LEVELS.ERROR, message, ...args),
    warn: (message, ...args) => log(namespace, DEBUG_LEVELS.WARNING, message, ...args),
    info: (message, ...args) => log(namespace, DEBUG_LEVELS.INFO, message, ...args),
    debug: (message, ...args) => log(namespace, DEBUG_LEVELS.DEBUG, message, ...args),
    trace: (message, ...args) => log(namespace, DEBUG_LEVELS.TRACE, message, ...args),
    group: (label) => group(namespace, label),
    groupEnd: () => groupEnd(),
    time: (label) => time(namespace, label),
    timeEnd: (label) => timeEnd(namespace, label)
  };
  
  return logger;
}

/**
 * Log a message at a specific level
 * @param {string} namespace - Debug namespace
 * @param {number} level - Debug level
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
function log(namespace, level, message, ...args) {
  const effectiveLevel = getEffectiveLevel(namespace);
  
  if (level <= effectiveLevel) {
    const timestamp = new Date().toISOString();
    const levelName = getDebugLevelName(level);
    const prefix = `[${timestamp}] [${levelName}] [${namespace}]`;
    
    switch (level) {
      case DEBUG_LEVELS.ERROR:
        console.error(prefix, message, ...args);
        break;
      case DEBUG_LEVELS.WARNING:
        console.warn(prefix, message, ...args);
        break;
      case DEBUG_LEVELS.INFO:
        console.info(prefix, message, ...args);
        break;
      case DEBUG_LEVELS.DEBUG:
      case DEBUG_LEVELS.TRACE:
      default:
        console.log(prefix, message, ...args);
        break;
    }
  }
}

/**
 * Start a console group
 * @param {string} namespace - Debug namespace
 * @param {string} label - Group label
 */
function group(namespace, label) {
  const effectiveLevel = getEffectiveLevel(namespace);
  
  if (DEBUG_LEVELS.DEBUG <= effectiveLevel) {
    console.group(`[${namespace}] ${label}`);
  }
}

/**
 * End a console group
 */
function groupEnd() {
  console.groupEnd();
}

/**
 * Start a timer
 * @param {string} namespace - Debug namespace
 * @param {string} label - Timer label
 */
function time(namespace, label) {
  const effectiveLevel = getEffectiveLevel(namespace);
  
  if (DEBUG_LEVELS.DEBUG <= effectiveLevel) {
    console.time(`[${namespace}] ${label}`);
  }
}

/**
 * End a timer
 * @param {string} namespace - Debug namespace
 * @param {string} label - Timer label
 */
function timeEnd(namespace, label) {
  const effectiveLevel = getEffectiveLevel(namespace);
  
  if (DEBUG_LEVELS.DEBUG <= effectiveLevel) {
    console.timeEnd(`[${namespace}] ${label}`);
  }
}

/**
 * Log a stack trace
 * @param {string} namespace - Debug namespace
 * @param {string} message - Log message
 */
function logStackTrace(namespace, message) {
  const effectiveLevel = getEffectiveLevel(namespace);
  
  if (DEBUG_LEVELS.DEBUG <= effectiveLevel) {
    console.trace(`[${namespace}] ${message}`);
  }
}

/**
 * Log object details with inspection
 * @param {string} namespace - Debug namespace
 * @param {string} label - Object label
 * @param {Object} obj - Object to inspect
 * @param {Object} options - Inspection options
 */
function logObject(namespace, label, obj, options = { depth: 2 }) {
  const effectiveLevel = getEffectiveLevel(namespace);
  
  if (DEBUG_LEVELS.DEBUG <= effectiveLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] [${namespace}] ${label}:`, obj);
  }
}

/**
 * Create a performance measuring function
 * @param {string} namespace - Debug namespace
 * @param {string} functionName - Function name
 * @returns {Function} Wrapped function
 */
function measurePerformance(namespace, functionName) {
  return function(fn) {
    return function(...args) {
      const effectiveLevel = getEffectiveLevel(namespace);
      
      if (DEBUG_LEVELS.DEBUG <= effectiveLevel) {
        console.time(`[${namespace}] ${functionName}`);
        try {
          return fn.apply(this, args);
        } finally {
          console.timeEnd(`[${namespace}] ${functionName}`);
        }
      } else {
        return fn.apply(this, args);
      }
    };
  };
}

// Create a global debug logger
const globalLogger = createLogger('global');

// Export the module
module.exports = {
  DEBUG_LEVELS,
  setDebugLevel,
  setNamespaceLevel,
  createLogger,
  logStackTrace,
  logObject,
  measurePerformance,
  logger: globalLogger
};