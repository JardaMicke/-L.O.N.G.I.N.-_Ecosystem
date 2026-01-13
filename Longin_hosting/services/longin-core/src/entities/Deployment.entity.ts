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
