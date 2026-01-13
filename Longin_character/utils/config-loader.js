/**
 * @fileoverview Configuration loader for the Longin AI installer
 * 
 * This module provides functionality to load, validate, and manage configuration
 * settings for the installer and application.
 * 
 * @module config-loader
 * @version 1.0.0
 * @author Longin AI Team
 * @license MIT
 */

// Determine if we're in Node.js or browser environment
const isNodeJs = typeof window === 'undefined' && typeof require === 'function';

// Default configuration values
const DEFAULT_CONFIG = {
  // Installation settings
  installation: {
    defaultPath: isNodeJs ? (process.platform === 'win32' ? 'C:\\Longin-AI' : '/opt/longin-ai') : 'C:\\Longin-AI',
    createShortcuts: true,
    autoStart: false,
    sourceType: 'github',
    githubRepo: 'https://github.com/username/longin-charakter-ai.git'
  },
  
  // Application settings
  application: {
    // Server settings
    server: {
      port: 3000,
      host: 'localhost',
      enableHttps: false,
      corsOrigin: '*'
    },
    
    // Database settings
    database: {
      type: 'sqlite',
      path: './database.sqlite',
      usePostgres: false,
      postgresUrl: 'postgresql://user:password@localhost:5432/longin_ai'
    },
    
    // External API settings
    apis: {
      ollamaUrl: 'http://localhost:11434',
      comfyUiUrl: 'http://localhost:7860',
      ttsUrl: 'http://localhost:5002'
    },
    
    // Feature flags
    features: {
      enableVoice: true,
      enableImageGeneration: true,
      enableCharacterCreation: true,
      enableAutoRepair: true
    },
    
    // Security settings
    security: {
      jwtSecret: 'longin-ai-jwt-secret-key',
      sessionSecret: 'longin-ai-session-secret-key',
      maxUploadSize: 10 * 1024 * 1024, // 10MB
      rateLimit: {
        enabled: true,
        maxRequests: 100,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    }
  },
  
  // Auto-repair settings
  autoRepair: {
    enabled: true,
    maxAttempts: 3,
    retryDelay: 2000,
    retryMultiplier: 1.5,
    maxRetryDelay: 10000,
    enableNetworkRetry: true,
    enableDependencyRepair: true,
    enableCodeIntegrityCheck: true,
    enableSelfHealing: true
  },
  
  // Logging settings
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    logDirectory: isNodeJs ? (process.platform === 'win32' ? '%TEMP%/longin-ai-logs' : '/tmp/longin-ai-logs') : null
  },
  
  // UI settings
  ui: {
    theme: 'dark',
    enableAnimations: true,
    showAdvancedOptions: false
  }
};

/**
 * @class ConfigLoader
 * @description Handles loading, validation, and management of configuration settings
 */
class ConfigLoader {
  /**
   * Creates a new ConfigLoader instance
   * @param {Object} options - Loader options
   * @param {string} options.configPath - Path to the configuration file
   * @param {Object} options.defaultConfig - Default configuration values
   */
  constructor(options = {}) {
    this.configPath = options.configPath || null;
    this.defaultConfig = options.defaultConfig || DEFAULT_CONFIG;
    this.config = { ...this.defaultConfig };
    this.validators = new Map();
    
    // Initialize built-in validators
    this._initializeValidators();
  }

  /**
   * Initializes built-in validators for configuration properties
   * @private
   */
  _initializeValidators() {
    // Port validator
    this.registerValidator('application.server.port', (value) => {
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        return { valid: false, message: 'Port must be a number between 1 and 65535' };
      }
      return { valid: true };
    });
    
    // URL validator
    const urlValidator = (value) => {
      try {
        new URL(value);
        return { valid: true };
      } catch (error) {
        return { valid: false, message: 'Invalid URL format' };
      }
    };
    
    this.registerValidator('application.apis.ollamaUrl', urlValidator);
    this.registerValidator('application.apis.comfyUiUrl', urlValidator);
    this.registerValidator('application.apis.ttsUrl', urlValidator);
    
    // Secret key validator
    const secretValidator = (value) => {
      if (typeof value !== 'string' || value.length < 16) {
        return { valid: false, message: 'Secret key must be at least 16 characters long' };
      }
      return { valid: true };
    };
    
    this.registerValidator('application.security.jwtSecret', secretValidator);
    this.registerValidator('application.security.sessionSecret', secretValidator);
    
    // Max upload size validator
    this.registerValidator('application.security.maxUploadSize', (value) => {
      const size = parseInt(value, 10);
      if (isNaN(size) || size < 1) {
        return { valid: false, message: 'Max upload size must be a positive number' };
      }
      return { valid: true };
    });
    
    // Log level validator
    this.registerValidator('logging.level', (value) => {
      const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'none'];
      if (!validLevels.includes(value.toLowerCase())) {
        return { valid: false, message: `Log level must be one of: ${validLevels.join(', ')}` };
      }
      return { valid: true };
    });
  }

  /**
   * Loads configuration from a file
   * @returns {Promise<Object>} Loaded configuration
   */
  async loadConfig() {
    // In browser environment, load from localStorage
    if (!isNodeJs) {
      try {
        const savedConfig = localStorage.getItem('configData');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          this.config = this._mergeConfigs(this.defaultConfig, parsed);
        }
      } catch (error) {
        console.error('Failed to load configuration from localStorage:', error);
      }
      
      return this.config;
    }
    
    // In Node.js environment, load from file
    if (!this.configPath) {
      console.warn('No configuration file path provided, using default configuration');
      return this.config;
    }
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Expand environment variables in configPath
      const expandedPath = this.configPath.replace(/%([^%]+)%/g, (_, n) => process.env[n]);
      
      if (!fs.existsSync(expandedPath)) {
        console.warn(`Configuration file not found at ${expandedPath}, using default configuration`);
        return this.config;
      }
      
      const fileContent = fs.readFileSync(expandedPath, 'utf8');
      let fileConfig;
      
      // Parse based on file extension
      const ext = path.extname(expandedPath).toLowerCase();
      
      if (ext === '.json') {
        fileConfig = JSON.parse(fileContent);
      } else if (ext === '.js') {
        fileConfig = require(expandedPath);
      } else {
        throw new Error(`Unsupported configuration file type: ${ext}`);
      }
      
      // Merge with defaults
      this.config = this._mergeConfigs(this.defaultConfig, fileConfig);
      
      return this.config;
    } catch (error) {
      console.error(`Failed to load configuration from ${this.configPath}:`, error);
      return this.config;
    }
  }

  /**
   * Saves configuration to a file or localStorage
   * @param {Object} config - Configuration to save
   * @returns {Promise<boolean>} True if save was successful
   */
  async saveConfig(config = null) {
    const configToSave = config || this.config;
    
    // In browser environment, save to localStorage
    if (!isNodeJs) {
      try {
        localStorage.setItem('configData', JSON.stringify(configToSave));
        return true;
      } catch (error) {
        console.error('Failed to save configuration to localStorage:', error);
        return false;
      }
    }
    
    // In Node.js environment, save to file
    if (!this.configPath) {
      console.error('No configuration file path provided, cannot save configuration');
      return false;
    }
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Expand environment variables in configPath
      const expandedPath = this.configPath.replace(/%([^%]+)%/g, (_, n) => process.env[n]);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(expandedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save based on file extension
      const ext = path.extname(expandedPath).toLowerCase();
      
      if (ext === '.json') {
        fs.writeFileSync(expandedPath, JSON.stringify(configToSave, null, 2), 'utf8');
      } else if (ext === '.js') {
        const content = `module.exports = ${JSON.stringify(configToSave, null, 2)};`;
        fs.writeFileSync(expandedPath, content, 'utf8');
      } else {
        throw new Error(`Unsupported configuration file type: ${ext}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to save configuration to ${this.configPath}:`, error);
      return false;
    }
  }

  /**
   * Gets a configuration value by path
   * @param {string} path - Dot-notation path to the configuration value
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    const parts = path.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }

  /**
   * Sets a configuration value by path
   * @param {string} path - Dot-notation path to the configuration value
   * @param {*} value - Value to set
   * @returns {boolean} True if value was set successfully
   */
  set(path, value) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let current = this.config;
    
    for (const part of parts) {
      if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    // Validate value if validator exists
    if (this.validators.has(path)) {
      const validator = this.validators.get(path);
      const result = validator(value);
      
      if (!result.valid) {
        console.error(`Invalid value for ${path}: ${result.message}`);
        return false;
      }
    }
    
    current[lastPart] = value;
    return true;
  }

  /**
   * Registers a validator for a configuration property
   * @param {string} path - Dot-notation path to the configuration property
   * @param {Function} validator - Validator function that returns { valid: boolean, message?: string }
   */
  registerValidator(path, validator) {
    this.validators.set(path, validator);
  }

  /**
   * Validates all configuration values
   * @returns {Object[]} Array of validation errors
   */
  validateConfig() {
    const errors = [];
    
    for (const [path, validator] of this.validators.entries()) {
      const value = this.get(path);
      const result = validator(value);
      
      if (!result.valid) {
        errors.push({
          path,
          message: result.message,
          value
        });
      }
    }
    
    return errors;
  }

  /**
   * Merges default configuration with user configuration
   * @param {Object} defaultConfig - Default configuration
   * @param {Object} userConfig - User configuration
   * @returns {Object} Merged configuration
   * @private
   */
  _mergeConfigs(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
      if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
        if (
          userConfig[key] !== null &&
          typeof userConfig[key] === 'object' &&
          !Array.isArray(userConfig[key]) &&
          typeof defaultConfig[key] === 'object' &&
          !Array.isArray(defaultConfig[key])
        ) {
          result[key] = this._mergeConfigs(defaultConfig[key], userConfig[key]);
        } else {
          result[key] = userConfig[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Creates a configuration file with default values
   * @param {string} path - Path to the configuration file
   * @returns {Promise<boolean>} True if file was created successfully
   */
  async createDefaultConfig(path = null) {
    const configPath = path || this.configPath;
    
    if (!configPath) {
      console.error('No configuration file path provided');
      return false;
    }
    
    // In browser environment, save to localStorage
    if (!isNodeJs) {
      try {
        localStorage.setItem('configData', JSON.stringify(this.defaultConfig));
        return true;
      } catch (error) {
        console.error('Failed to save default configuration to localStorage:', error);
        return false;
      }
    }
    
    // In Node.js environment, save to file
    try {
      const fs = require('fs');
      const pathModule = require('path');
      
      // Expand environment variables in configPath
      const expandedPath = configPath.replace(/%([^%]+)%/g, (_, n) => process.env[n]);
      
      // Create directory if it doesn't exist
      const dir = pathModule.dirname(expandedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save based on file extension
      const ext = pathModule.extname(expandedPath).toLowerCase();
      
      if (ext === '.json') {
        fs.writeFileSync(expandedPath, JSON.stringify(this.defaultConfig, null, 2), 'utf8');
      } else if (ext === '.js') {
        const content = `/**
 * @fileoverview Default configuration for Longin AI
 * 
 * This file contains default configuration settings for the Longin AI application.
 * Modify these settings as needed for your environment.
 */

module.exports = ${JSON.stringify(this.defaultConfig, null, 2)};`;
        
        fs.writeFileSync(expandedPath, content, 'utf8');
      } else {
        throw new Error(`Unsupported configuration file type: ${ext}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to create default configuration at ${configPath}:`, error);
      return false;
    }
  }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ConfigLoader,
    DEFAULT_CONFIG
  };
} else if (typeof window !== 'undefined') {
  // Expose to browser
  window.ConfigLoader = ConfigLoader;
  window.DEFAULT_CONFIG = DEFAULT_CONFIG;
}