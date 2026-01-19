/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'candy-ai-clone-secret-key';

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Neplatný nebo expirovaný token' });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Autentizace vyžadována' });
  }
};

module.exports = authenticateJWT;