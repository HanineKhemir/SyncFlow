import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Note } from '../../note/entities/note.entity';
import { Task } from '../../task/entities/task.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';
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
}
