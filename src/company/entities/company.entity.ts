import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, DeleteDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Note } from '../../note/entities/note.entity';
import { Task } from '../../task/entities/task.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';
import { Operation } from 'src/history/entities/operation.entity';
@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; 

  @Column()
  name: string;

  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => Note, note => note.company)
  notes: Note[];

  @OneToMany(() => Task, task => task.company)
  tasks: Task[];

  @OneToMany(() => Schedule, schedule => schedule.company)
  schedules: Schedule[];
  @OneToMany(() => Operation, operation => operation.company)
  operations: Operation[]; // Assuming Operation has a company relation


  @DeleteDateColumn()
  deletedAt?: Date;

}
