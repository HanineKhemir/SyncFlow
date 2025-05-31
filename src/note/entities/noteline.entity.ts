import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Note } from '../../note/entities/note.entity';
import { Task } from '../../task/entities/task.entity';
@Entity()
export class NoteLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lineNumber: number;

  @Column()
  content: string;

  @ManyToOne(() => Note, note => note.lines)
  note: Note;

  @ManyToOne(() => User, user => user.editedLines)
  lastEditedBy: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({default: '#000000' })
  color: string;

  @Column({default: 16 })
  fontSize: number;
  
  @Column({ default: false })
  highlighted: boolean;
}
