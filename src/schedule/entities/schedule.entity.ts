import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'timestamp' })
  start: Date;

  @Column({ type: 'timestamp' })
  end: Date;

  @ManyToOne(() => Company, company => company.schedules)
  company: Company;

  @ManyToOne(() => User, { nullable: false }) 
  createdBy: User;

  @Column({ nullable: true })
  meetingLink: string;
}
