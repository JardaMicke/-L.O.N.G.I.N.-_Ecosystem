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
