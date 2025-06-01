import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';

import { Task } from './entities/task.entity';
import { TaskEvents } from './task.events';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { CreateEventService } from '../history/create-event.service';
import { Operation } from '../history/entities/operation.entity';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Company, User, Operation]),
  ],
  providers: [TaskService, TaskEvents, CreateEventService, UserService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
