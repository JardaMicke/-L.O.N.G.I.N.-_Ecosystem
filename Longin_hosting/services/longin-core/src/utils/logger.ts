import winston from 'winston';
import Transport from 'winston-transport';
import net from 'net';

// Custom Logstash Transport to avoid dependency issues
class LogstashTransport extends Transport {
  private host: string;
  private port: number;
  private node_name: string;
  private client: net.Socket | null = null;
  private connecting: boolean = false;
  private queue: any[] = [];

  constructor(opts: any) {
    super(opts);
    this.host = opts.host;
    this.port = opts.port;
    this.node_name = opts.node_name || 'longin-core';
    this.connect();
  }

  connect() {
    if (this.connecting || this.client) return;
    this.connecting = true;

    const socket = new net.Socket();
    
    socket.on('connect', () => {
      console.log('Connected to Logstash');
      this.client = socket;
      this.connecting = false;
      this.flushQueue();
    });

    socket.on('error', (err) => {
      // console.error('Logstash connection error:', err.message);
      this.disconnect();
    });

    socket.on('close', () => {
      this.disconnect();
      // Retry connection after 5s
      setTimeout(() => this.connect(), 5000);
    });

    socket.connect(this.port, this.host);
  }

  disconnect() {
    this.client = null;
    this.connecting = false;
  }

  flushQueue() {
    if (!this.client) return;
    while (this.queue.length > 0) {
      const entry = this.queue.shift();
      this.writeToSocket(entry);
    }
  }

  writeToSocket(info: any) {
    if (this.client) {
      this.client.write(JSON.stringify(info) + '\n');
    } else {
      // Limit queue size to prevent memory leaks
      if (this.queue.length < 1000) {
        this.queue.push(info);
      }
    }
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const logEntry = {
      ...info,
      service: this.node_name,
      '@timestamp': new Date().toISOString()
    };

    this.writeToSocket(logEntry);
    
    callback();
  }
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add Logstash transport if configured
if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_PORT) {
  transports.push(
    new LogstashTransport({
      host: process.env.LOGSTASH_HOST,
      port: parseInt(process.env.LOGSTASH_PORT, 10),
      node_name: 'longin-core'
    })
  );
} else if (process.env.NODE_ENV === 'production') {
    transports.push(
        new LogstashTransport({
          host: 'longin-logstash',
          port: 5044,
          node_name: 'longin-core'
        })
    );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'longin-core' },
  transports: transports,
});

export default logger;
