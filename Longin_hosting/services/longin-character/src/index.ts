import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { EventBus } from './services/EventBus';

dotenv.config();

// Logger setup
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Event Bus
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const eventBus = new EventBus(redisUrl, logger);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'longin-character' });
});

// Socket.IO
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on('chat_message', async (msg) => {
    logger.info('Received chat message', msg);
    // TODO: Process with LLM
    eventBus.publish('character.thought', {
      clientId: socket.id,
      content: 'Thinking about response...'
    });
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`Longin Character Service running on port ${PORT}`);
  eventBus.subscribe('core.events', (msg) => {
    logger.info('Received core event', msg);
  });
});
