/* eslint-disable prettier/prettier */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { Item } from '@modules/item/entities/item.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

export enum Status {
    ACTIVE = "active",
    RETURNED = "returned",
    OVERDUE = "overdue"
}

@Entity({ name: 'loans' })
@Index(['userId', 'status'])
@Index(['itemId', 'status'])
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item?: Item;

  @Column({ type: 'timestamptz' })
  loanedAt!: Date;

  @Column({ type: 'timestamptz' })
  dueAt!: Date;

  @Column({ type: 'timestamptz' })
  returnedAt!: Date;

  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status!: Status;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.0 })
  fineAmount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}