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
