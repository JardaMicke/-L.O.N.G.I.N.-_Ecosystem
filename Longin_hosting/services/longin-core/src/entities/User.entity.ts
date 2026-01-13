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
