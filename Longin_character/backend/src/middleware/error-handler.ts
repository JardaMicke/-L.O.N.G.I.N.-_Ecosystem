/**
 * Centralizovaný systém pro zpracování chyb
 * Zajišťuje konzistentní formátování a logování chyb v aplikaci
 * @module middleware/error-handler
 */

import { Request, Response, NextFunction } from 'express';
import logger, { logError as logErrorUtil } from '../utils/logger';

// Konstanty pro typy chyb
export const ERROR_TYPES = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    DATABASE: 'DATABASE_ERROR',
    EXTERNAL_API: 'EXTERNAL_API_ERROR',
    FILE_SYSTEM: 'FILE_SYSTEM_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    SERVER: 'SERVER_ERROR'
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

export class AppError extends Error {
    public type: ErrorType;
    public status: number;
    public details: any;

    constructor(message: string, type: ErrorType = ERROR_TYPES.SERVER, status: number = 500, details: any = null) {
        super(message);
        this.type = type;
        this.status = status;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Kategorizuje chybu podle typu a nastaví odpovídající HTTP status
 * @param {Error} error - Objekt chyby
 * @returns {object} - Typ chyby, status a zpráva
 */
function categorizeError (error: any): { type: ErrorType; status: number; message: string } {
    // Výchozí hodnoty
    let type: ErrorType = ERROR_TYPES.SERVER;
    let status = 500;
    let message = 'Interní chyba serveru';

    if (error instanceof AppError)
    {
        return { type: error.type, status: error.status, message: error.message };
    }

    // Zpracování různých typů chyb
    if (error.name === 'ValidationError' || error.type === ERROR_TYPES.VALIDATION)
    {
        type = ERROR_TYPES.VALIDATION;
        status = 400;
        message = error.message || 'Neplatná data';
    }
    else if (error.name === 'AuthenticationError' || error.type === ERROR_TYPES.AUTHENTICATION)
    {
        type = ERROR_TYPES.AUTHENTICATION;
        status = 401;
        message = error.message || 'Neautorizovaný přístup';
    }
    else if (error.name === 'AuthorizationError' || error.type === ERROR_TYPES.AUTHORIZATION)
    {
        type = ERROR_TYPES.AUTHORIZATION;
        status = 403;
        message = error.message || 'Přístup zakázán';
    }
    else if (error.name === 'NotFoundError' || error.type === ERROR_TYPES.NOT_FOUND)
    {
        type = ERROR_TYPES.NOT_FOUND;
        status = 404;
        message = error.message || 'Zdroj nebyl nalezen';
    }
    else if (error.name === 'DatabaseError' || error.type === ERROR_TYPES.DATABASE)
    {
        type = ERROR_TYPES.DATABASE;
        status = 500;
        message = 'Chyba databáze';
    }
    else if (error.name === 'ExternalAPIError' || error.type === ERROR_TYPES.EXTERNAL_API)
    {
        type = ERROR_TYPES.EXTERNAL_API;
        status = 502;
        message = error.message || 'Chyba externí služby';
    }
    else if (error.name === 'FileSystemError' || error.type === ERROR_TYPES.FILE_SYSTEM)
    {
        type = ERROR_TYPES.FILE_SYSTEM;
        status = 500;
        message = error.message || 'Chyba souborového systému';
    }
    else if (error.name === 'RateLimitError' || error.type === ERROR_TYPES.RATE_LIMIT)
    {
        type = ERROR_TYPES.RATE_LIMIT;
        status = 429;
        message = error.message || 'Překročen limit požadavků';
    }
    else if (error.message)
    {
        message = error.message;
    }

    return { type, status, message };
}

/**
 * Zpracuje a vrátí chybovou odpověď
 */
export function handleError (error: any, req?: Request, res?: Response): any {
    // Určení typu chyby a statusu
    const { type, status, message } = categorizeError(error);

    // Vytvoření strukturovaného objektu chyby
    const formattedError = {
        error: {
            type,
            message,
            path: req ? req.path : null,
            timestamp: new Date().toISOString(),
            stack: undefined as string | undefined,
            details: undefined as any
        }
    };

    // Přidání detailů pro vývojáře v režimu vývoje
    if (process.env.NODE_ENV !== 'production')
    {
        formattedError.error.stack = error.stack;
        formattedError.error.details = error.details || null;
    }

    // Logování chyby using existing logger util
    logErrorUtil(`${type}: ${message}`, error, { path: req?.path });

    // Odeslání odpovědi
    if (res && !res.headersSent)
    {
        res.status(status).json(formattedError);
    }

    return formattedError;
}

// Helpers
export const createError = (message: string, type: ErrorType = ERROR_TYPES.SERVER, details: any = null): AppError => {
    // Map type to status code
    let status = 500;
    if (type === ERROR_TYPES.VALIDATION) status = 400;
    else if (type === ERROR_TYPES.AUTHENTICATION) status = 401;
    else if (type === ERROR_TYPES.AUTHORIZATION) status = 403;
    else if (type === ERROR_TYPES.NOT_FOUND) status = 404;
    else if (type === ERROR_TYPES.RATE_LIMIT) status = 429;
    else if (type === ERROR_TYPES.EXTERNAL_API) status = 502;

    return new AppError(message, type, status, details);
};

export const validationError = (message: string, details?: any) => createError(message, ERROR_TYPES.VALIDATION, details);
export const authenticationError = (message: string, details?: any) => createError(message, ERROR_TYPES.AUTHENTICATION, details);
export const authorizationError = (message: string, details?: any) => createError(message, ERROR_TYPES.AUTHORIZATION, details);
export const notFoundError = (message: string, details?: any) => createError(message, ERROR_TYPES.NOT_FOUND, details);
export const databaseError = (message: string, details?: any) => createError(message, ERROR_TYPES.DATABASE, details);
export const externalApiError = (message: string, details?: any) => createError(message, ERROR_TYPES.EXTERNAL_API, details);
export const fileSystemError = (message: string, details?: any) => createError(message, ERROR_TYPES.FILE_SYSTEM, details);
export const rateLimitError = (message: string, details?: any) => createError(message, ERROR_TYPES.RATE_LIMIT, details);
export const serverError = (message: string, details?: any) => createError(message, ERROR_TYPES.SERVER, details);

/**
 * Vytvoří middleware pro zpracování chyb v Express
 */
export const errorMiddleware = () => {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
        handleError(err, req, res);
    };
};

export default errorMiddleware;
