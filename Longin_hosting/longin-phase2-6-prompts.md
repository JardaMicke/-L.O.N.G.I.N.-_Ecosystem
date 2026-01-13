# 🚀 LONGIN HOSTING - PROMPTS FÁZE 2-6 PRO AI AGENTA

**Verze:** 1.0  
**Status:** READY FOR IMPLEMENTATION  
**Pro:** Claude / Cursor AI Agent  
**Chunk Strategy:** 512+ token contexts (segmented tasks)

---

## 📚 OBSAH

- [Prompt 2: Database Schema & TypeORM](#prompt-2)
- [Prompt 3: Authentication & JWT](#prompt-3)
- [Prompt 4: Docker Integration (dockerode)](#prompt-4)
- [Prompt 5: Real-time & WebSocket (Socket.io)](#prompt-5)
- [Prompt 6: Frontend React & State Management](#prompt-6)
- [Prompt 7: Monitoring, Logging & Deployment](#prompt-7)

---

<a name="prompt-2"></a>

## 🔴 PROMPT 2: DATABASE SCHEMA COMPLETE & TYPEORM ENTITIES

**Cíl:** Vytvoř kompletní PostgreSQL schema (7 tabulek) + TypeORM entities + migrations  
**Doba:** 8-10 hodin  
**Dependencies:** TASK 1.4 (database folder)  
**Output:** Plně funkční database s migracemi

### 📋 DETAILNÍ SPECIFIKACE

#### 1️⃣ TABULKY K VYTVOŘENÍ

```
1. users                    (7 columns + indexes)
2. applications            (10 columns + foreign keys)
3. containers              (9 columns + FK)
4. deployments             (10 columns + FK)
5. metrics                 (8 columns + FK + indexes)
6. github_webhooks         (9 columns + FK)
7. api_logs                (12 columns + FK + indexes)
```

#### 2️⃣ USERS TABLE SCHÉMA

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  
  -- Permissioning
  role VARCHAR(50) NOT NULL DEFAULT 'user',  -- 'admin', 'user', 'developer'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires_at TIMESTAMP,
  
  -- Preferences
  theme VARCHAR(50) DEFAULT 'dark',  -- 'dark', 'light'
  notifications_enabled BOOLEAN DEFAULT true,
  timezone VARCHAR(100) DEFAULT 'UTC',
  
  -- Session tracking
  last_login TIMESTAMP,
  last_login_ip VARCHAR(45),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,  -- Soft delete support
  
  -- Indexes
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
);

-- Trigger pro updated_at
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

#### 3️⃣ APPLICATIONS TABLE

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Configuration
  port INTEGER UNIQUE NOT NULL,  -- 3100-4000 range
  environment VARCHAR(50) DEFAULT 'development',
  
  -- Git integration
  github_repo_url VARCHAR(500),
  github_branch VARCHAR(100) DEFAULT 'main',
  github_webhook_id UUID REFERENCES github_webhooks(id),
  
  -- Status & limits
  status VARCHAR(50) DEFAULT 'stopped',  -- 'running', 'stopped', 'error'
  max_instances INTEGER DEFAULT 1,
  current_instances INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_port (port),
  CONSTRAINT unique_user_app_name UNIQUE (user_id, name)
);

-- Trigger
CREATE TRIGGER update_applications_timestamp
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

#### 4️⃣ CONTAINERS TABLE

```sql
CREATE TABLE containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Docker info
  docker_container_id VARCHAR(255) UNIQUE,
  docker_image_name VARCHAR(500),
  
  -- Networking
  internal_port INTEGER,
  host_port INTEGER,
  container_ip VARCHAR(45),
  
  -- Lifecycle
  status VARCHAR(50) DEFAULT 'created',  -- 'created', 'running', 'paused', 'stopped', 'exited'
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  
  -- Resource tracking
  memory_limit_mb INTEGER,
  cpu_shares INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_application_id (application_id),
  INDEX idx_status (status),
  INDEX idx_docker_container_id (docker_container_id),
  INDEX idx_created_at (created_at)
);

CREATE TRIGGER update_containers_timestamp
BEFORE UPDATE ON containers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

#### 5️⃣ DEPLOYMENTS TABLE

```sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Git info
  commit_sha VARCHAR(40),
  commit_message TEXT,
  branch VARCHAR(100),
  
  -- Deployment info
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'building', 'running', 'success', 'failed'
  
  -- Build
  build_started_at TIMESTAMP,
  build_completed_at TIMESTAMP,
  build_duration_seconds INTEGER,
  build_log TEXT,
  
  -- Logs
  deployment_log TEXT,
  error_message TEXT,
  
  -- Metadata
  triggered_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_application_id (application_id),
  INDEX idx_status (status),
  INDEX idx_commit_sha (commit_sha),
  INDEX idx_created_at (created_at)
);

CREATE TRIGGER update_deployments_timestamp
BEFORE UPDATE ON deployments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

#### 6️⃣ METRICS TABLE

```sql
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- CPU & Memory
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_mb DECIMAL(10,2),
  memory_limit_mb INTEGER,
  
  -- Network
  network_rx_bytes BIGINT,
  network_tx_bytes BIGINT,
  
  -- Disk
  disk_used_mb DECIMAL(10,2),
  
  -- Timestamps
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_container_id (container_id),
  INDEX idx_application_id (application_id),
  INDEX idx_recorded_at (recorded_at),
  INDEX idx_application_recorded (application_id, recorded_at)
);

-- Table partition by date (monthly)
-- ALTER TABLE metrics PARTITION BY RANGE (YEAR(recorded_at) * 100 + MONTH(recorded_at))
```

#### 7️⃣ GITHUB_WEBHOOKS TABLE

```sql
CREATE TABLE github_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Webhook config
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(255) NOT NULL,
  github_webhook_id BIGINT UNIQUE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_ping_at TIMESTAMP,
  last_ping_status_code INTEGER,
  
  -- Events subscribed
  events_subscribed TEXT,  -- JSON array: ["push", "pull_request"]
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_application_id (application_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
);

CREATE TRIGGER update_github_webhooks_timestamp
BEFORE UPDATE ON github_webhooks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

#### 8️⃣ API_LOGS TABLE

```sql
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  application_id UUID REFERENCES applications(id),
  
  -- Request info
  method VARCHAR(10),  -- GET, POST, etc.
  endpoint VARCHAR(500),
  query_params JSON,
  request_body_size INTEGER,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  response_body_size INTEGER,
  
  -- Client info
  user_agent VARCHAR(500),
  ip_address VARCHAR(45),
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_application_id (application_id),
  INDEX idx_status_code (status_code),
  INDEX idx_logged_at (logged_at),
  INDEX idx_endpoint_logged (endpoint, logged_at),
  INDEX idx_response_time (response_time_ms)
);

-- TTL: Delete logs older than 90 days
-- CREATE JOB delete_old_logs AS
--   DELETE FROM api_logs WHERE logged_at < CURRENT_TIMESTAMP - INTERVAL 90 DAY;
```

---

### 🔹 HELPER FUNCTIONS

```sql
-- Trigger function pro updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence pro port allocation
CREATE SEQUENCE app_port_sequence START WITH 3100 INCREMENT BY 1;

-- Function pro generování port čísel
CREATE OR REPLACE FUNCTION get_next_port()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('app_port_sequence');
END;
$$ LANGUAGE plpgsql;
```

---

### 🔹 INIT-DB.SQL KOMPLETNÍ

Soubor `services/database/init-db.sql`:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;  -- For future AI features

-- Create helper functions first
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE app_port_sequence START WITH 3100 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION get_next_port()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('app_port_sequence');
END;
$$ LANGUAGE plpgsql;

-- ============= TABLES =============
-- [Vložit všechny CREATE TABLE statements výše]

-- ============= INITIAL DATA =============
-- Vytvoř admin uživatele (heslo se mění na produkci!)
INSERT INTO users (username, email, password_hash, role, is_verified, is_active)
VALUES ('admin', 'admin@longin.local', '$2b$10$PLACEHOLDER_HASH_HERE', 'admin', true, true)
ON CONFLICT (username) DO NOTHING;

-- Vytvoř demo aplikaci
INSERT INTO applications (user_id, name, slug, description, port, environment)
SELECT id, 'Demo App', 'demo-app', 'Demo aplikace pro testování', get_next_port(), 'development'
FROM users WHERE username = 'admin'
ON CONFLICT (slug) DO NOTHING;
```

---

### 🔹 TYPEORM ENTITIES (TypeScript)

**Soubor:** `services/longin-core/src/entities/User.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Application } from './Application.entity';
import { Deployment } from './Deployment.entity';
import { GithubWebhook } from './GithubWebhook.entity';
import { ApiLog } from './ApiLog.entity';

@Entity('users')
@Index(['username'])
@Index(['email'])
@Index(['role'])
@Index(['is_active'])
@Index(['created_at'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  username: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  // Profile
  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url?: string;

  // Permissioning
  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: 'admin' | 'user' | 'developer';

  // Status
  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verification_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  verification_token_expires_at?: Date;

  // Preferences
  @Column({ type: 'varchar', length: 50, default: 'dark' })
  theme: 'dark' | 'light';

  @Column({ default: true })
  notifications_enabled: boolean;

  @Column({ type: 'varchar', length: 100, default: 'UTC' })
  timezone: string;

  // Session
  @Column({ type: 'timestamp', nullable: true })
  last_login?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_login_ip?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  // Relations
  @OneToMany(() => Application, (app) => app.user)
  applications: Application[];

  @OneToMany(() => Deployment, (dep) => dep.triggered_by)
  deployments: Deployment[];

  @OneToMany(() => GithubWebhook, (webhook) => webhook.user)
  webhooks: GithubWebhook[];

  @OneToMany(() => ApiLog, (log) => log.user)
  api_logs: ApiLog[];

  @BeforeInsert()
  setDefaults() {
    this.role = this.role || 'user';
    this.is_active = this.is_active ?? true;
    this.is_verified = this.is_verified ?? false;
  }
}
```

**Soubor:** `services/longin-core/src/entities/Application.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User.entity';
import { Container } from './Container.entity';
import { Deployment } from './Deployment.entity';
import { GithubWebhook } from './GithubWebhook.entity';
import { Metric } from './Metric.entity';
import { ApiLog } from './ApiLog.entity';

@Entity('applications')
@Index(['user_id'])
@Index(['slug'])
@Index(['status'])
@Index(['port'])
@Unique(['user_id', 'name'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer', unique: true })
  port: number;

  @Column({ type: 'varchar', length: 50, default: 'development' })
  environment: 'development' | 'staging' | 'production';

  // Git integration
  @Column({ type: 'varchar', length: 500, nullable: true })
  github_repo_url?: string;

  @Column({ type: 'varchar', length: 100, default: 'main' })
  github_branch: string;

  @Column({ type: 'uuid', nullable: true })
  github_webhook_id?: string;

  // Status
  @Column({ type: 'varchar', length: 50, default: 'stopped' })
  status: 'running' | 'stopped' | 'error' | 'building';

  @Column({ default: 1 })
  max_instances: number;

  @Column({ default: 0 })
  current_instances: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Container, (container) => container.application)
  containers: Container[];

  @OneToMany(() => Deployment, (deployment) => deployment.application)
  deployments: Deployment[];

  @OneToMany(() => Metric, (metric) => metric.application)
  metrics: Metric[];

  @OneToMany(() => ApiLog, (log) => log.application)
  api_logs: ApiLog[];

  @OneToMany(() => GithubWebhook, (webhook) => webhook.application)
  webhooks: GithubWebhook[];
}
```

**Soubor:** `services/longin-core/src/entities/Container.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Application } from './Application.entity';
import { Metric } from './Metric.entity';

@Entity('containers')
@Index(['application_id'])
@Index(['status'])
@Index(['docker_container_id'])
@Index(['created_at'])
export class Container {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  // Docker info
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  docker_container_id?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  docker_image_name?: string;

  // Networking
  @Column({ type: 'integer', nullable: true })
  internal_port?: number;

  @Column({ type: 'integer', nullable: true })
  host_port?: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  container_ip?: string;

  // Lifecycle
  @Column({ type: 'varchar', length: 50, default: 'created' })
  status: 'created' | 'running' | 'paused' | 'stopped' | 'exited';

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  stopped_at?: Date;

  // Resources
  @Column({ type: 'integer', nullable: true })
  memory_limit_mb?: number;

  @Column({ type: 'integer', nullable: true })
  cpu_shares?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Application, (app) => app.containers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @OneToMany(() => Metric, (metric) => metric.container)
  metrics: Metric[];
}
```

**Soubor:** `services/longin-core/src/entities/Deployment.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Application } from './Application.entity';
import { User } from './User.entity';

@Entity('deployments')
@Index(['application_id'])
@Index(['status'])
@Index(['commit_sha'])
@Index(['created_at'])
export class Deployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  // Git
  @Column({ type: 'varchar', length: 40, nullable: true })
  commit_sha?: string;

  @Column({ type: 'text', nullable: true })
  commit_message?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  branch?: string;

  // Status
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: 'pending' | 'building' | 'running' | 'success' | 'failed';

  // Build
  @Column({ type: 'timestamp', nullable: true })
  build_started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  build_completed_at?: Date;

  @Column({ type: 'integer', nullable: true })
  build_duration_seconds?: number;

  @Column({ type: 'text', nullable: true })
  build_log?: string;

  // Logs
  @Column({ type: 'text', nullable: true })
  deployment_log?: string;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  // Metadata
  @Column({ type: 'uuid', nullable: true })
  triggered_by_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Application, (app) => app.deployments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @ManyToOne(() => User, (user) => user.deployments, {
    nullable: true,
  })
  @JoinColumn({ name: 'triggered_by_id' })
  triggered_by?: User;
}
```

**Soubor:** `services/longin-core/src/entities/Metric.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Container } from './Container.entity';
import { Application } from './Application.entity';

@Entity('metrics')
@Index(['container_id'])
@Index(['application_id'])
@Index(['recorded_at'])
@Index(['application_id', 'recorded_at'])
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  container_id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  // CPU & Memory
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cpu_usage_percent?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  memory_usage_mb?: number;

  @Column({ type: 'integer', nullable: true })
  memory_limit_mb?: number;

  // Network
  @Column({ type: 'bigint', nullable: true })
  network_rx_bytes?: number;

  @Column({ type: 'bigint', nullable: true })
  network_tx_bytes?: number;

  // Disk
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  disk_used_mb?: number;

  @CreateDateColumn()
  recorded_at: Date;

  // Relations
  @ManyToOne(() => Container, (container) => container.metrics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'container_id' })
  container: Container;

  @ManyToOne(() => Application, (app) => app.metrics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}
```

**Soubor:** `services/longin-core/src/entities/GithubWebhook.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Application } from './Application.entity';

@Entity('github_webhooks')
@Index(['application_id'])
@Index(['user_id'])
@Index(['is_active'])
export class GithubWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  // Config
  @Column({ type: 'varchar', length: 500, nullable: true })
  webhook_url?: string;

  @Column({ type: 'varchar', length: 255 })
  webhook_secret: string;

  @Column({ type: 'bigint', unique: true, nullable: true })
  github_webhook_id?: number;

  // Status
  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_ping_at?: Date;

  @Column({ type: 'integer', nullable: true })
  last_ping_status_code?: number;

  // Events
  @Column({ type: 'text', nullable: true })
  events_subscribed?: string; // JSON: ["push", "pull_request"]

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Application, (app) => app.webhooks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @ManyToOne(() => User, (user) => user.webhooks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**Soubor:** `services/longin-core/src/entities/ApiLog.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Application } from './Application.entity';

@Entity('api_logs')
@Index(['user_id'])
@Index(['application_id'])
@Index(['status_code'])
@Index(['logged_at'])
@Index(['endpoint', 'logged_at'])
@Index(['response_time_ms'])
export class ApiLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id?: string;

  @Column({ type: 'uuid', nullable: true })
  application_id?: string;

  // Request
  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column({ type: 'jsonb', nullable: true })
  query_params?: Record<string, any>;

  @Column({ type: 'integer', nullable: true })
  request_body_size?: number;

  // Response
  @Column({ type: 'integer' })
  status_code: number;

  @Column({ type: 'integer' })
  response_time_ms: number;

  @Column({ type: 'integer', nullable: true })
  response_body_size?: number;

  // Client
  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent?: string;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  // Error
  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @CreateDateColumn()
  logged_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.api_logs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Application, (app) => app.api_logs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'application_id' })
  application?: Application;
}
```

---

### 🔹 TYPEORM CONFIG

**Soubor:** `services/longin-core/src/config/database.ts`

```typescript
import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { Application } from '../entities/Application.entity';
import { Container } from '../entities/Container.entity';
import { Deployment } from '../entities/Deployment.entity';
import { Metric } from '../entities/Metric.entity';
import { GithubWebhook } from '../entities/GithubWebhook.entity';
import { ApiLog } from '../entities/ApiLog.entity';

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
```

---

### 🔹 TYPEORM MIGRATION COMMANDS

```bash
# Generuj migraci (automaticky porovnává entities s DB)
pnpm typeorm:generate src/migrations/initial-schema

# Spusť migrace
pnpm typeorm:migrate

# Vrať migraci (revert)
pnpm typeorm:revert

# Zobraz status migrace
pnpm typeorm:show

# Vymaž všechny tabulky (PRODUCTION: NIKDY!)
pnpm typeorm:drop
```

**V package.json přidat:**

```json
{
  "scripts": {
    "typeorm": "typeorm-cli -d src/config/database.ts",
    "typeorm:generate": "pnpm typeorm migration:generate",
    "typeorm:migrate": "pnpm typeorm migration:run",
    "typeorm:revert": "pnpm typeorm migration:revert",
    "typeorm:show": "pnpm typeorm migration:show",
    "typeorm:drop": "pnpm typeorm schema:drop"
  }
}
```

---

### ✅ CHECKLIST PRO TASK 2.1

- [ ] init-db.sql obsahuje všech 7 tabulek
- [ ] Všechny indexy a constraints vytvořeny
- [ ] Trigger funkce pro updated_at vytvořeny
- [ ] Všechny TypeORM entities vytvořeny (.ts soubory)
- [ ] database.ts config vytvořen
- [ ] TypeORM migration systém konfigurován
- [ ] Testy databáze: `pnpm typeorm:migrate` běží bez chyb
- [ ] Vztahy (relations) mezi entitami ověřeny

---

<a name="prompt-3"></a>

## 🔴 PROMPT 3: AUTHENTICATION & JWT TOKENS

**Cíl:** Kompletní auth systém s JWT access/refresh tokens + secure password hashing  
**Doba:** 8-10 hodin  
**Dependencies:** TASK 2.1, 2.2  
**Output:** Working auth service + endpoints

### 📋 JWT STRATEGIE

```
Access Token (SHORT-LIVED):
  - Validity: 15 minut
  - Storage: In-memory (frontend) nebo Authorization header
  - Payload: { userId, email, role }
  - Secret: process.env.JWT_ACCESS_SECRET

Refresh Token (LONG-LIVED):
  - Validity: 7 dní
  - Storage: HttpOnly cookie (SECURE!)
  - Payload: { userId }
  - Secret: process.env.JWT_REFRESH_SECRET
  - Also stored in Redis pro revocation
```

### 🔹 JWT UTILITIES

**Soubor:** `services/longin-core/src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'developer';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * Generuj access token (15 minut)
 */
export function generateAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

/**
 * Generuj refresh token (7 dní)
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

/**
 * Ověř access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
}

/**
 * Ověř refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
}

/**
 * Dekóduj token bez ověření
 */
export function decodeToken(token: string) {
  return jwt.decode(token);
}

/**
 * Extrahuj token z Authorization headeru
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer "
}
```

### 🔹 PASSWORD UTILITIES

**Soubor:** `services/longin-core/src/utils/password.ts`

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashuj heslo
 */
export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Porovnaj heslo s hashem
 */
export async function comparePassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Validuj sílu hesla
 * Vyžaduje:
 * - Minimálně 8 znaků
 * - Alespoň jedno velké písmeno
 * - Alespoň jedno malé písmeno
 * - Alespoň jednu číslici
 * - Alespoň jeden speciální znak
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%...)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generuj dočasné heslo (pro reset)
 */
export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
```

### 🔹 AUTH SERVICE

**Soubor:** `services/longin-core/src/services/auth.service.ts`

```typescript
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';
import { AppDataSource } from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { redisClient } from '../config/redis';

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Registruj nového uživatele
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Validuj input
    if (!dto.username || !dto.email || !dto.password) {
      throw new Error('Missing required fields');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Validuj sílu hesla
    const strength = validatePasswordStrength(dto.password);
    if (!strength.valid) {
      throw new Error(`Password validation failed: ${strength.errors.join(', ')}`);
    }

    // Kontroluj duplikáty
    const existing = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existing) {
      throw new Error('Username or email already exists');
    }

    // Hashuj heslo
    const password_hash = await hashPassword(dto.password);

    // Vytvoř uživatele
    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password_hash,
      role: 'user',
    });

    await this.userRepository.save(user);

    // Generuj tokeny
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Ulož refresh token v Redis
    await redisClient.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 dní
      refreshToken,
    );

    return {
      accessToken,
      refreshToken,
      user: this.mapUserToDto(user),
    };
  }

  /**
   * Přihlaš uživatele
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Najdi uživatele
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Porovnaj heslo
    const isValid = await comparePassword(dto.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Aktualizuj last_login
    user.last_login = new Date();
    await this.userRepository.save(user);

    // Generuj tokeny
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Ulož refresh token v Redis
    await redisClient.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken,
    );

    return {
      accessToken,
      refreshToken,
      user: this.mapUserToDto(user),
    };
  }

  /**
   * Obnov access token pomocí refresh tokenu
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Ověř token
    const payload = verifyRefreshToken(refreshToken);

    // Kontroluj Redis (pro možné blacklistování)
    const storedToken = await redisClient.get(`refresh_token:${payload.userId}`);
    if (storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Najdi uživatele
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    // Generuj nový access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    return { accessToken };
  }

  /**
   * Odhlášení uživatele
   */
  async logout(userId: string): Promise<void> {
    // Smaž refresh token z Redis
    await redisClient.del(`refresh_token:${userId}`);
  }

  /**
   * Najdi uživatele bez hesla
   */
  async findUserById(userId: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    return user ? this.mapUserToDto(user) : null;
  }

  /**
   * Validuj uživatele
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      return null;
    }

    const isValid = await comparePassword(password, user.password_hash);
    return isValid ? user : null;
  }

  /**
   * Privátní metoda: mapuj User entity na DTO (bez hesla)
   */
  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
    };
  }
}
```

### 🔹 DTOs & VALIDATORS

**Soubor:** `services/longin-core/src/dtos/auth.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  confirmPassword: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class UserDto {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export class TokenDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: Date;
}
```

### 🔹 MIDDLEWARE - AUTH PROTECTION

**Soubor:** `services/longin-core/src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token',
      });
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Middleware pro kontrolu role-based access
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
}
```

### 🔹 AUTH ROUTES

**Soubor:** `services/longin-core/src/routes/auth.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dtos/auth.dto';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/register
 * Registruj nového uživatele
 */
router.post('/register', validateRequest(RegisterDto), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);

    // Ulož refresh token v HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dní
    });

    return res.status(201).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Přihlaš uživatele
 */
router.post('/login', validateRequest(LoginDto), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);

    // Ulož refresh token v HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      message: 'Login successful',
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Obnov access token
 */
router.post('/refresh', validateRequest(RefreshTokenDto), async (req: Request, res: Response) => {
  try {
    // Refresh token z cookie nebo body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided',
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
      message: 'Token refreshed',
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Odhlášení (vyžaduje autentifikaci)
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    await authService.logout(req.user.id);

    // Smaž cookie
    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Vrátí aktuálně přihlášeného uživatele
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

### ✅ CHECKLIST PRO TASK 2.3

- [ ] jwt.ts s všemi funkcemi vytvořen
- [ ] password.ts s hashing vytvořen
- [ ] AuthService kompletní
- [ ] Všechny DTOs vytvořeny + validators
- [ ] Auth middleware vytvořen
- [ ] Všechny 5 endpoints pracují
- [ ] Integration testy napsány a procházejí
- [ ] Postman collection vytvořena

---

<a name="prompt-4"></a>

## 🔴 PROMPT 4: DOCKER INTEGRATION (dockerode)

**Cíl:** Integrace Docker SDK pro správu kontejnerů, create/start/stop/logs  
**Doba:** 8-10 hodin  
**Dependencies:** TASK 1.2 (longin-core)  
**Output:** Docker service + container management API

### 📋 DOCKER WRAPPER SERVICE

**Soubor:** `services/longin-core/src/services/docker.service.ts`

```typescript
import Docker, { Container as DockerContainer } from 'dockerode';
import { logger } from '../utils/logger';

export interface CreateContainerOptions {
  imageName: string;
  containerName: string;
  port: number;
  internalPort: number;
  env?: Record<string, string>;
  memoryLimit?: number; // MB
  cpuShares?: number;
}

export interface ContainerInfo {
  id: string;
  name: string;
  state: string;
  status: string;
  ports: any[];
  imageId: string;
}

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock', // Linux/Mac
      // socketPath: '//./pipe/docker_engine', // Windows WSL2
    });
  }

  /**
   * Vytvoř Docker kontejner
   */
  async createContainer(options: CreateContainerOptions): Promise<string> {
    try {
      logger.info(`Creating container: ${options.containerName}`);

      const container = await this.docker.createContainer({
        Image: options.imageName,
        name: options.containerName,
        Env: this.buildEnvArray(options.env),
        ExposedPorts: {
          [`${options.internalPort}/tcp`]: {},
        },
        HostConfig: {
          PortBindings: {
            [`${options.internalPort}/tcp`]: [
              {
                HostPort: String(options.port),
              },
            ],
          },
          Memory: (options.memoryLimit || 512) * 1024 * 1024, // Convert MB to bytes
          CpuShares: options.cpuShares || 1024,
          RestartPolicy: {
            Name: 'unless-stopped',
            MaximumRetryCount: 0,
          },
          LogConfig: {
            Type: 'json-file',
            Config: {
              'max-size': '10m',
              'max-file': '3',
            },
          },
        },
        Healthcheck: {
          Test: ['CMD', 'curl', '-f', `http://localhost:${options.internalPort}/health`],
          Interval: 30 * 1000000000, // 30 seconds in nanoseconds
          Timeout: 10 * 1000000000,
          Retries: 3,
          StartPeriod: 60 * 1000000000,
        },
      });

      logger.info(`Container created: ${container.id.substring(0, 12)}`);
      return container.id;
    } catch (error) {
      logger.error(`Failed to create container: ${error.message}`);
      throw error;
    }
  }

  /**
   * Spusť kontejner
   */
  async startContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.start();
      logger.info(`Container started: ${containerId.substring(0, 12)}`);
    } catch (error) {
      logger.error(`Failed to start container: ${error.message}`);
      throw error;
    }
  }

  /**
   * Zastavit kontejner
   */
  async stopContainer(containerId: string, timeout: number = 10): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: timeout });
      logger.info(`Container stopped: ${containerId.substring(0, 12)}`);
    } catch (error) {
      logger.error(`Failed to stop container: ${error.message}`);
      throw error;
    }
  }

  /**
   * Smaž kontejner
   */
  async removeContainer(containerId: string, force: boolean = false): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force });
      logger.info(`Container removed: ${containerId.substring(0, 12)}`);
    } catch (error) {
      logger.error(`Failed to remove container: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inspekuj kontejner (detailní info)
   */
  async inspectContainer(containerId: string) {
    try {
      const container = this.docker.getContainer(containerId);
      return await container.inspect();
    } catch (error) {
      logger.error(`Failed to inspect container: ${error.message}`);
      throw error;
    }
  }

  /**
   * Listuj všechny kontejnery
   */
  async listContainers(all: boolean = false): Promise<ContainerInfo[]> {
    try {
      const containers = await this.docker.listContainers({ all });
      return containers.map((c) => ({
        id: c.Id,
        name: c.Names[0]?.replace(/^\//, '') || '',
        state: c.State,
        status: c.Status,
        ports: c.Ports,
        imageId: c.ImageID,
      }));
    } catch (error) {
      logger.error(`Failed to list containers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ziskej logy kontejneru
   */
  async getContainerLogs(
    containerId: string,
    options: { tail?: number; since?: number } = {},
  ): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: options.tail || 100,
      });

      // Dekóduj Docker log stream
      return logs.toString();
    } catch (error) {
      logger.error(`Failed to get logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stream logy v reálném čase (pro WebSocket)
   */
  async streamContainerLogs(
    containerId: string,
    onData: (data: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      const stream = await container.logs({
        stdout: true,
        stderr: true,
        follow: true,
      });

      stream.on('data', (chunk) => {
        onData(chunk.toString());
      });

      stream.on('error', (error) => {
        onError(error);
      });
    } catch (error) {
      onError(error as Error);
    }
  }

  /**
   * Ziskej kontejnerové statistiky (CPU, memory, network)
   */
  async getContainerStats(containerId: string): Promise<any> {
    try {
      const container = this.docker.getContainer(containerId);
      return new Promise((resolve, reject) => {
        container.stats((error, stream) => {
          if (error) reject(error);

          let data = '';
          stream.on('data', (chunk) => {
            data += chunk.toString();
          });

          stream.on('end', () => {
            try {
              const stats = JSON.parse(data);
              resolve(this.parseStats(stats));
            } catch (e) {
              reject(e);
            }
          });

          // Automaticky zavři stream po 5 sekundách
          setTimeout(() => {
            stream.destroy();
          }, 5000);
        });
      });
    } catch (error) {
      logger.error(`Failed to get stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pull image z Docker registru
   */
  async pullImage(imageName: string): Promise<void> {
    try {
      logger.info(`Pulling image: ${imageName}`);

      return new Promise((resolve, reject) => {
        this.docker.pull(imageName, (error, stream) => {
          if (error) reject(error);

          this.docker.modem.followProgress(stream, (err, res) => {
            if (err) reject(err);
            logger.info(`Image pulled successfully: ${imageName}`);
            resolve();
          });
        });
      });
    } catch (error) {
      logger.error(`Failed to pull image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Privátní metody
   */

  private buildEnvArray(env?: Record<string, string>): string[] {
    const envArray: string[] = [
      'NODE_ENV=production',
      'TZ=UTC',
    ];

    if (env) {
      for (const [key, value] of Object.entries(env)) {
        envArray.push(`${key}=${value}`);
      }
    }

    return envArray;
  }

  private parseStats(stats: any): any {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * 100.0;

    const memoryUsage = stats.memory_stats.usage;
    const memoryLimit = stats.memory_stats.limit;
    const memoryPercent = (memoryUsage / memoryLimit) * 100.0;

    return {
      cpu_usage_percent: parseFloat(cpuPercent.toFixed(2)),
      memory_usage_mb: parseFloat((memoryUsage / 1024 / 1024).toFixed(2)),
      memory_limit_mb: Math.round(memoryLimit / 1024 / 1024),
      memory_percent: parseFloat(memoryPercent.toFixed(2)),
      network_rx_bytes: stats.networks?.eth0?.rx_bytes || 0,
      network_tx_bytes: stats.networks?.eth0?.tx_bytes || 0,
    };
  }
}

export const dockerService = new DockerService();
```

### 🔹 CONTAINER MANAGEMENT SERVICE

**Soubor:** `services/longin-core/src/services/container.service.ts`

```typescript
import { Repository } from 'typeorm';
import { Container } from '../entities/Container.entity';
import { Application } from '../entities/Application.entity';
import { Metric } from '../entities/Metric.entity';
import { AppDataSource } from '../config/database';
import { dockerService } from './docker.service';
import { logger } from '../utils/logger';

export interface CreateContainerDto {
  applicationId: string;
  dockerImageName: string;
  internalPort: number;
  memoryLimit?: number;
  cpuShares?: number;
}

export class ContainerService {
  private containerRepository: Repository<Container>;
  private applicationRepository: Repository<Application>;
  private metricRepository: Repository<Metric>;

  constructor() {
    this.containerRepository = AppDataSource.getRepository(Container);
    this.applicationRepository = AppDataSource.getRepository(Application);
    this.metricRepository = AppDataSource.getRepository(Metric);
  }

  /**
   * Vytvoř a startuj nový kontejner pro aplikaci
   */
  async createAndStartContainer(dto: CreateContainerDto): Promise<Container> {
    try {
      // Najdi aplikaci
      const app = await this.applicationRepository.findOne({
        where: { id: dto.applicationId },
      });

      if (!app) {
        throw new Error('Application not found');
      }

      // Pull image
      await dockerService.pullImage(dto.dockerImageName);

      // Vytvoř Docker kontejner
      const containerId = await dockerService.createContainer({
        imageName: dto.dockerImageName,
        containerName: `${app.slug}-container-${Date.now()}`,
        port: app.port,
        internalPort: dto.internalPort,
        memoryLimit: dto.memoryLimit,
        cpuShares: dto.cpuShares,
        env: {
          APP_PORT: String(dto.internalPort),
          APP_NAME: app.name,
        },
      });

      // Ulož do DB
      const container = this.containerRepository.create({
        application_id: app.id,
        docker_container_id: containerId,
        docker_image_name: dto.dockerImageName,
        internal_port: dto.internalPort,
        host_port: app.port,
        status: 'created',
        memory_limit_mb: dto.memoryLimit,
        cpu_shares: dto.cpuShares,
      });

      await this.containerRepository.save(container);

      // Spusť kontejner
      await dockerService.startContainer(containerId);
      container.status = 'running';
      container.started_at = new Date();
      await this.containerRepository.save(container);

      logger.info(`Container started for app ${app.name}`);
      return container;
    } catch (error) {
      logger.error(`Failed to create container: ${error.message}`);
      throw error;
    }
  }

  /**
   * Zastavit a smaž kontejner
   */
  async stopAndRemoveContainer(containerId: string): Promise<void> {
    try {
      const container = await this.containerRepository.findOne({
        where: { id: containerId },
      });

      if (!container) {
        throw new Error('Container not found');
      }

      if (container.docker_container_id) {
        await dockerService.stopContainer(container.docker_container_id);
        await dockerService.removeContainer(container.docker_container_id, true);
      }

      container.status = 'stopped';
      container.stopped_at = new Date();
      await this.containerRepository.save(container);

      logger.info(`Container stopped: ${containerId}`);
    } catch (error) {
      logger.error(`Failed to stop container: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ziskej logy kontejneru
   */
  async getContainerLogs(containerId: string): Promise<string> {
    try {
      const container = await this.containerRepository.findOne({
        where: { id: containerId },
      });

      if (!container || !container.docker_container_id) {
        throw new Error('Container not found');
      }

      return await dockerService.getContainerLogs(container.docker_container_id);
    } catch (error) {
      logger.error(`Failed to get logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ziskej metriky (CPU, memory, network)
   */
  async collectMetrics(containerId: string): Promise<Metric> {
    try {
      const container = await this.containerRepository.findOne({
        where: { id: containerId },
      });

      if (!container || !container.docker_container_id) {
        throw new Error('Container not found');
      }

      const stats = await dockerService.getContainerStats(
        container.docker_container_id,
      );

      // Ulož metriky do DB
      const metric = this.metricRepository.create({
        container_id: container.id,
        application_id: container.application_id,
        cpu_usage_percent: stats.cpu_usage_percent,
        memory_usage_mb: stats.memory_usage_mb,
        memory_limit_mb: stats.memory_limit_mb,
        network_rx_bytes: stats.network_rx_bytes,
        network_tx_bytes: stats.network_tx_bytes,
      });

      await this.metricRepository.save(metric);
      return metric;
    } catch (error) {
      logger.error(`Failed to collect metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Listuj všechny kontejnery pro aplikaci
   */
  async listContainersForApp(applicationId: string): Promise<Container[]> {
    return this.containerRepository.find({
      where: { application_id: applicationId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Ziskej status kontejneru z Docker daemon
   */
  async syncContainerStatus(containerId: string): Promise<string> {
    try {
      const container = await this.containerRepository.findOne({
        where: { id: containerId },
      });

      if (!container || !container.docker_container_id) {
        throw new Error('Container not found');
      }

      const info = await dockerService.inspectContainer(container.docker_container_id);
      const status = info.State.Running ? 'running' : 'stopped';

      // Aktualizuj status v DB
      container.status = status as any;
      await this.containerRepository.save(container);

      return status;
    } catch (error) {
      logger.error(`Failed to sync status: ${error.message}`);
      throw error;
    }
  }
}

export const containerService = new ContainerService();
```

### 🔹 DOCKER ROUTES

**Soubor:** `services/longin-core/src/routes/container.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { containerService } from '../services/container.service';

const router = Router();

/**
 * POST /api/containers
 * Vytvoř a startuj nový kontejner
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { applicationId, dockerImageName, internalPort, memoryLimit, cpuShares } = req.body;

    const container = await containerService.createAndStartContainer({
      applicationId,
      dockerImageName,
      internalPort,
      memoryLimit,
      cpuShares,
    });

    return res.status(201).json({
      success: true,
      data: container,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/containers/:id
 * Ziskej status kontejneru
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Sync status s Docker daemon
    const status = await containerService.syncContainerStatus(req.params.id);

    return res.status(200).json({
      success: true,
      data: { status },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/containers/:id/logs
 * Ziskej logy kontejneru
 */
router.get('/:id/logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const logs = await containerService.getContainerLogs(req.params.id);

    return res.status(200).json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/containers/:id/metrics
 * Ziskej metriky (CPU, memory)
 */
router.get('/:id/metrics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const metrics = await containerService.collectMetrics(req.params.id);

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/containers/:id
 * Zastavit a smaž kontejner
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await containerService.stopAndRemoveContainer(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Container stopped and removed',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/applications/:appId/containers
 * Listuj všechny kontejnery pro aplikaci
 */
router.get('/app/:appId/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const containers = await containerService.listContainersForApp(req.params.appId);

    return res.status(200).json({
      success: true,
      data: containers,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

### ✅ CHECKLIST PRO TASK 4

- [ ] docker.service.ts vytvořen + všechny metody
- [ ] container.service.ts vytvořen
- [ ] Container routes vytvořeny (5 endpoints)
- [ ] Docker socket správně nakonfigurován
- [ ] Kontejnery lze vytvořit a spouštět
- [ ] Logy jsou dostupné
- [ ] Metriky se sbírají
- [ ] Unit testy napsány

---

Due to character limit, budu pokračovat v další odpovědi s Prompts 5-7 a complete dokumentem pro upload.

Chci teď vytvořit zbývající 3 prompty (5, 6, 7) a pak je všechny połoží do jednoho finálního `.md` dokumentu. Chceš aby pokračuji se zbytkem?