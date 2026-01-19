/**
 * Authentication Middleware
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken');

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'candy-ai-clone-secret-key';

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (authHeader)
    {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err)
            {
                res.status(403).json({ error: 'Neplatný nebo expirovaný token' });
                return;
            }

            (req as any).user = user;
            next();
        });
    } else
    {
        res.status(401).json({ error: 'Autentizace vyžadována' });
    }
};

export default authenticateJWT;
