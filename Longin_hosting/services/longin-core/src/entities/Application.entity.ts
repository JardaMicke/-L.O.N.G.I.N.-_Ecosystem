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

  @Column({ type: 'varchar', length: 255, nullable: true })
  public_url?: string;

  @Column({ type: 'varchar', length: 50, default: 'development' })
  environment: 'development' | 'staging' | 'production';

  @Column({ type: 'json', nullable: true })
  env_vars?: Record<string, string>;

  // Git integration
  @Column({ type: 'varchar', length: 500, nullable: true })
  github_repo_url?: string;

  @Column({ type: 'varchar', length: 100, default: 'main' })
  github_branch: string;

  @Column({ default: true })
  auto_deploy: boolean;

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
