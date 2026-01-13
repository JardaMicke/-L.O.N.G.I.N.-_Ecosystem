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
