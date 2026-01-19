/**
 * Centralizovaný systém pro zpracování chyb
 * Zajišťuje konzistentní formátování a logování chyb v aplikaci
 */
const fs = require('fs');
const path = require('path');

// Konstanty pro typy chyb
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  FILE_SYSTEM: 'FILE_SYSTEM_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR'
};

/**
 * Zpracuje a vrátí chybovou odpověď
 * @param {Error} error - Objekt chyby
 * @param {object} req - Express request objekt
 * @param {object} res - Express response objekt
 */
function handleError(error, req, res) {
  // Určení typu chyby a statusu
  const { type, status, message } = categorizeError(error);
  
  // Vytvoření strukturovaného objektu chyby
  const formattedError = {
    error: {
      type,
      message,
      path: req ? req.path : null,
      timestamp: new Date().toISOString()
    }
  };
  
  // Přidání detailů pro vývojáře v režimu vývoje
  if (process.env.NODE_ENV !== 'production') {
    formattedError.error.stack = error.stack;
    formattedError.error.details = error.details || null;
  }
  
  // Logování chyby
  logError(formattedError, error);
  
  // Odeslání odpovědi
  if (res) {
    res.status(status).json(formattedError);
  }
  
  return formattedError;
}

/**
 * Kategorizuje chybu podle typu a nastaví odpovídající HTTP status
 * @param {Error} error - Objekt chyby
 * @returns {object} - Typ chyby, status a zpráva
 */
function categorizeError(error) {
  // Výchozí hodnoty
  let type = ERROR_TYPES.SERVER;
  let status = 500;
  let message = 'Interní chyba serveru';
  
  // Zpracování různých typů chyb
  if (error.name === 'ValidationError' || error.type === ERROR_TYPES.VALIDATION) {
    type = ERROR_TYPES.VALIDATION;
    status = 400;
    message = error.message || 'Neplatná data';
  } 
  else if (error.name === 'AuthenticationError' || error.type === ERROR_TYPES.AUTHENTICATION) {
    type = ERROR_TYPES.AUTHENTICATION;
    status = 401;
    message = error.message || 'Neautorizovaný přístup';
  }
  else if (error.name === 'AuthorizationError' || error.type === ERROR_TYPES.AUTHORIZATION) {
    type = ERROR_TYPES.AUTHORIZATION;
    status = 403;
    message = error.message || 'Přístup zakázán';
  }
  else if (error.name === 'NotFoundError' || error.type === ERROR_TYPES.NOT_FOUND) {
    type = ERROR_TYPES.NOT_FOUND;
    status = 404;
    message = error.message || 'Zdroj nebyl nalezen';
  }
  else if (error.name === 'DatabaseError' || error.type === ERROR_TYPES.DATABASE) {
    type = ERROR_TYPES.DATABASE;
    status = 500;
    message = 'Chyba databáze';
  }
  else if (error.name === 'ExternalAPIError' || error.type === ERROR_TYPES.EXTERNAL_API) {
    type = ERROR_TYPES.EXTERNAL_API;
    status = 502;
    message = error.message || 'Chyba externí služby';
  }
  else if (error.name === 'FileSystemError' || error.type === ERROR_TYPES.FILE_SYSTEM) {
    type = ERROR_TYPES.FILE_SYSTEM;
    status = 500;
    message = error.message || 'Chyba souborového systému';
  }
  else if (error.name === 'RateLimitError' || error.type === ERROR_TYPES.RATE_LIMIT) {
    type = ERROR_TYPES.RATE_LIMIT;
    status = 429;
    message = error.message || 'Překročen limit požadavků';
  }
  
  return { type, status, message };
}

/**
 * Loguje chybu do souboru a na konzoli
 * @param {object} formattedError - Naformátovaná chyba
 * @param {Error} originalError - Původní objekt chyby
 */
function logError(formattedError, originalError) {
  // Logování na konzoli
  console.error('\x1b[31m%s\x1b[0m', '[ERROR]', formattedError.error.type, formattedError.error.message);
  
  if (originalError && originalError.stack) {
    console.error(originalError.stack);
  }
  
  // Logování do souboru
  const logDir = path.join(__dirname, 'logs');
  
  // Vytvoření složky pro logy, pokud neexistuje
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      console.error('Nepodařilo se vytvořit složku pro logy:', err);
      return;
    }
  }
  
  const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  const logMessage = `[${formattedError.error.timestamp}] ${formattedError.error.type}: ${formattedError.error.message}\nPath: ${formattedError.error.path}\n${originalError && originalError.stack ? originalError.stack : ''}\n\n`;
  
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error('Nepodařilo se zapsat chybu do logu:', err);
  }
}

/**
 * Vytváří chybu s danými parametry
 * @param {string} message - Chybová zpráva
 * @param {string} type - Typ chyby
 * @param {object} details - Detaily chyby
 * @returns {Error} - Vytvořená chyba
 */
function createError(message, type = ERROR_TYPES.SERVER, details = null) {
  const error = new Error(message);
  error.type = type;
  error.details = details;
  return error;
}

// Vytváření specializovaných funkcí pro jednotlivé typy chyb
const validationError = (message, details) => createError(message, ERROR_TYPES.VALIDATION, details);
const authenticationError = (message, details) => createError(message, ERROR_TYPES.AUTHENTICATION, details);
const authorizationError = (message, details) => createError(message, ERROR_TYPES.AUTHORIZATION, details);
const notFoundError = (message, details) => createError(message, ERROR_TYPES.NOT_FOUND, details);
const databaseError = (message, details) => createError(message, ERROR_TYPES.DATABASE, details);
const externalApiError = (message, details) => createError(message, ERROR_TYPES.EXTERNAL_API, details);
const fileSystemError = (message, details) => createError(message, ERROR_TYPES.FILE_SYSTEM, details);
const rateLimitError = (message, details) => createError(message, ERROR_TYPES.RATE_LIMIT, details);
const serverError = (message, details) => createError(message, ERROR_TYPES.SERVER, details);

/**
 * Vytvoří middleware pro zpracování chyb v Express
 * @returns {function} - Express middleware
 */
function errorMiddleware() {
  return (err, req, res, next) => {
    handleError(err, req, res);
  };
}

module.exports = {
  handleError,
  createError,
  validationError,
  authenticationError,
  authorizationError,
  notFoundError,
  databaseError,
  externalApiError,
  fileSystemError,
  rateLimitError,
  serverError,
  errorMiddleware,
  ERROR_TYPES
};