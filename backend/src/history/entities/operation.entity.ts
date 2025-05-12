import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Target } from 'src/enum/target.enum';

@Entity()
export class Operation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'CREATE' | 'UPDATE' | 'DELETE';

  @Column()
  date: Date;

  @Column()
  description: string;
  
  @Column({type:'enum', enum: Target})
  targettype: Target;

  @Column()
  target: number;

  @ManyToOne(() => User)
  @JoinColumn()
  performedBy: User;
}