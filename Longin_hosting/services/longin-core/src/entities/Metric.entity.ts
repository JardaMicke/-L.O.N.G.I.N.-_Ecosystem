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
