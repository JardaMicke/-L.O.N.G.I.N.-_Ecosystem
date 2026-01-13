import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { Application } from '../entities/Application.entity';
import { Container } from '../entities/Container.entity';
import { Deployment } from '../entities/Deployment.entity';
import { Metric } from '../entities/Metric.entity';
import { GithubWebhook } from '../entities/GithubWebhook.entity';
import { ApiLog } from '../entities/ApiLog.entity';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'longin',
  password: process.env.DATABASE_PASSWORD || 'longin',
  database: process.env.DATABASE_NAME || 'longin_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Application,
    Container,
    Deployment,
    Metric,
    GithubWebhook,
    ApiLog,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
  extra: {
    max: 10, // Connection pool size
  },
});
