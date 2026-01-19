/**
 * Služba pro optimalizaci výkonu serveru
 * Implementuje různé techniky pro zlepšení rychlosti a efektivity
 */
const memoryCache = require('memory-cache');
const compression = require('compression');

/**
 * Nastaví optimalizace pro Express aplikaci
 */
function setupOptimizations() {
  // Nastavení mezí paměti pro uvolnění garbage collection
  setupMemoryLimits();
  
  // Nastavení zachytávání nezpracovaných výjimek
  setupUnhandledExceptionHandling();
  
  console.log('Optimalizace serveru byly nastaveny');
}

/**
 * Nastaví limity paměti a spustí garbage collection v případě potřeby
 */
function setupMemoryLimits() {
  // Nastavení intervalového kontrolního mechanismu pro paměť
  const maxMemoryUsage = 1024 * 1024 * 1024; // 1GB
  const checkInterval = 60 * 1000; // 1 minuta
  
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    
    // Logování využití paměti při překročení 80% limitu
    if (memoryUsage.heapUsed > maxMemoryUsage * 0.8) {
      console.warn(`Vysoké využití paměti: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(maxMemoryUsage / 1024 / 1024)}MB`);
    }
    
    // Vyčištění cache pokud je využití paměti příliš vysoké
    if (memoryUsage.heapUsed > maxMemoryUsage * 0.9) {
      memoryCache.clear();
      
      // Force garbage collection pokud je k dispozici node-gc
      if (global.gc) {
        global.gc();
        console.log('Paměť byla vyčištěna a garbage collection byl spuštěn');
      }
    }
  }, checkInterval);
}

/**
 * Nastaví zachytávání nezpracovaných výjimek a odmítnutí promises
 */
function setupUnhandledExceptionHandling() {
  process.on('uncaughtException', (error) => {
    console.error('Nezachycená výjimka:', error);
    // Logovat, ale neukončovat proces
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Nezachycené odmítnutí promise:', reason);
    // Logovat, ale neukončovat proces
  });
}

/**
 * Vytvoří middleware pro caching odpovědí
 * @param {number} duration - Doba v milisekundách, po kterou bude odpověď v cache
 * @returns {function} - Express middleware
 */
function cacheMiddleware(duration) {
  return (req, res, next) => {
    // Přeskočení cache pro autentifikované požadavky a POST/PUT/DELETE metody
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `__cache__${req.originalUrl || req.url}`;
    const cachedBody = memoryCache.get(key);
    
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    
    // Zachytit původní res.send metodu
    const originalSend = res.send;
    
    // Přepsat res.send metodu pro ukládání do cache
    res.send = function(body) {
      memoryCache.put(key, body, duration);
      originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Vytvoří middleware pro rate limiting
 * @param {number} maxRequests - Maximální počet požadavků v daném časovém okně
 * @param {number} windowMs - Časové okno v milisekundách
 * @returns {function} - Express middleware
 */
function rateLimitMiddleware(maxRequests, windowMs) {
  const requests = new Map();
  
  // Čištění starých záznamů
  setInterval(() => {
    const now = Date.now();
    
    for (const [key, timestamps] of requests.entries()) {
      const filtered = timestamps.filter(timestamp => now - timestamp < windowMs);
      
      if (filtered.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, filtered);
      }
    }
  }, windowMs);
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}`;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const timestamps = requests.get(key);
    const now = Date.now();
    
    // Vyfiltrovat staré časové značky
    const recentTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);
    
    if (recentTimestamps.length >= maxRequests) {
      return res.status(429).json({
        error: {
          type: 'RATE_LIMIT_ERROR',
          message: 'Překročen limit požadavků. Zkuste to prosím později.'
        }
      });
    }
    
    // Přidat aktuální časovou značku
    recentTimestamps.push(now);
    requests.set(key, recentTimestamps);
    
    next();
  };
}

/**
 * Vytvoří optimalizované nastavení komprese
 * @returns {function} - Express middleware pro kompresi
 */
function compressionMiddleware() {
  return compression({
    // Filtr určující, kdy použít kompresi
    filter: (req, res) => {
      // Nepoužívat kompresi pro malé odpovědi
      if (res.getHeader('Content-Length') && parseInt(res.getHeader('Content-Length')) < 1024) {
        return false;
      }
      
      // Použít standardní filtr compression knihovny
      return compression.filter(req, res);
    },
    // Úroveň komprese (0-9, kde 9 je nejvyšší komprese)
    level: 6
  });
}

/**
 * Odstraní citlivé informace z objektu před odesláním klientovi
 * @param {object} data - Objekt k sanitizaci
 * @returns {object} - Sanitizovaný objekt
 */
function sanitizeData(data) {
  if (!data) return data;
  
  // Pokud je data objekt
  if (typeof data === 'object' && data !== null) {
    // Kopie pro manipulaci
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    // Seznam citlivých polí, která by měla být odstraněna
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'apiSecret', 'api_secret'];
    
    // Odstranění citlivých polí
    if (!Array.isArray(sanitized)) {
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          delete sanitized[field];
        }
      }
    }
    
    // Rekurzivní sanitizace vnořených objektů
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  return data;
}

module.exports = {
  setupOptimizations,
  cacheMiddleware,
  rateLimitMiddleware,
  compressionMiddleware,
  sanitizeData
};