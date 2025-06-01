import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Target } from 'src/enum/target.enum';
import { OperationType } from 'src/enum/operation-type';
@Entity()
export class Operation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'enum', enum: OperationType})
  type: OperationType;

  @Column()
  date: Date;

  @Column({ type: 'text' })
  description: string;
  
  @Column({type:'enum', enum: Target})
  targettype: Target;

  @Column()
  target: number;

  @ManyToOne(() => User)
  @JoinColumn()
  performedBy: User;
}