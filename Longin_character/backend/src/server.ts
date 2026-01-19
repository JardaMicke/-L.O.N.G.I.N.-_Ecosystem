/**
 * Longin Character Backend - Main Server Entry Point
 * @module server
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import logger, { logInfo, logError } from './utils/logger';
import { ApiResponse, AppConfig } from './types';

// Load configuration
const config: AppConfig = {
    port: parseInt(process.env.PORT || '3011', 10),
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
    coreApiUrl: process.env.CORE_API_URL || 'http://localhost:3001',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    openaiApiKey: process.env.OPENAI_API_KEY,
    claudeApiKey: process.env.ANTHROPIC_API_KEY
};

const app: Application = express();

// ============================================================
// Middleware
// ============================================================

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logInfo(`${req.method} ${req.path}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });
    next();
});

// Static files
const assetsPath = path.join(__dirname, '../assets');
if (fs.existsSync(assetsPath))
{
    app.use('/assets', express.static(assetsPath));
}

// ============================================================
// Health Check Routes
// ============================================================

app.get('/', (req: Request, res: Response) => {
    const response: ApiResponse = {
        success: true,
        data: {
            message: 'Longin Character API is running',
            version: '2.0.0',
            environment: config.nodeEnv
        },
        meta: {
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        }
    };
    res.json(response);
});

app.get('/health', (req: Request, res: Response) => {
    const response: ApiResponse = {
        success: true,
        data: {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        }
    };
    res.json(response);
});

// ============================================================
// API Routes
// ============================================================

import apiRoutes from './routes/api';
app.use('/api', apiRoutes);

// ============================================================
// Error Handling
// ============================================================

// 404 handler
app.use((req: Request, res: Response) => {
    const response: ApiResponse = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        }
    };
    res.status(404).json(response);
});

// Global error handler
// Global error handler
import errorMiddleware from './middleware/error-handler';
app.use(errorMiddleware());

// ============================================================
// Server Startup
// ============================================================

const ensureDirectories = (): void => {
    const dirs = [
        path.join(__dirname, '../assets/uploads'),
        path.join(__dirname, '../assets/images'),
        path.join(__dirname, '../data/memories'),
        path.join(__dirname, '../logs')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir))
        {
            fs.mkdirSync(dir, { recursive: true });
            logInfo(`Created directory: ${dir}`);
        }
    });
};

const startServer = (): void => {
    ensureDirectories();

    app.listen(config.port, () => {
        logger.info('='.repeat(50));
        logger.info(`🚀 Longin Character API v2.0.0`);
        logger.info(`📡 Server running on port ${config.port}`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Core API: ${config.coreApiUrl}`);
        logger.info(`🤖 Ollama: ${config.ollamaBaseUrl}`);
        logger.info('='.repeat(50));
    });
};

// Start server if main module
if (require.main === module)
{
    startServer();
}

export { app, config };
export default app;
