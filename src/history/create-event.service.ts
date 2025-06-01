import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Operation } from 'src/history/entities/operation.entity';
import { OperationDto } from 'src/history/dto/operation.dto';
import { UserService } from 'src/user/user.service';
import { json } from 'stream/consumers';
import { CreateOperationDto } from 'src/history/dto/create-operation.dto';
import { Target } from 'src/enum/target.enum';
import { User } from 'src/user/entities/user.entity';
import { Note } from 'src/note/entities/note.entity';
import { NoteLine } from 'src/note/entities/noteline.entity';
import { Schedule } from 'src/schedule/entities/schedule.entity';
import { Task } from 'src/task/entities/task.entity';
import { Event } from 'src/events/entities/event.entity';
@Injectable()
export class CreateEventService {
  constructor(
    @InjectRepository(Operation)
    private eventRepository: Repository<Operation>,
    private readonly UserService: UserService,
    private eventEmitter: EventEmitter2
  ) {}

  async createEvent(eventData: OperationDto) {
  const user = await this.UserService.findOne(eventData.userId); 

  if (!user) {
    throw new Error('User not found');
  }

  let targetType: Target;
  let data = eventData.data;
  let restData: any;

  if (data instanceof User) {
    targetType = Target.USER;
    const { company, ...rest } = data;
    restData = rest;
  } else if (data instanceof Task) {
    targetType = Target.TASK;
    const { company, ...rest } = data;
    restData = rest;
  } else if (data instanceof Schedule) {
    targetType = Target.SCHEDULE;
    const { company, ...rest } = data;
    restData = rest;
  } else if (data instanceof Note) {
    targetType = Target.NOTE;
    const { company, ...rest } = data;
    restData = rest;
  } else if (data instanceof NoteLine) {
    targetType = Target.NOTELINE;
    const { note, ...rest } = data;
    restData = rest;
  } else if (data instanceof Event) {
    targetType = Target.EVENT;
    restData = data;
  }
  else {
    throw new Error('Could not determine target type');
  }


  const op: CreateOperationDto = {
    type: eventData.type,
    description: JSON.stringify(restData),
    performedBy: user,
    target: eventData.data.id,
    targettype: targetType,
    date: new Date(),
    company: user.company,
  };

  const newEvent = this.eventRepository.create(op);
  await this.eventRepository.save(newEvent);
  console.log('Event created:', newEvent);
  this.eventEmitter.emit(`event.created.${user.company?.code}`, newEvent);
}


//   async getEventById(id: string): Promise<Event | null> {
//     const event = await this.eventRepository.findById(id);
//     return event;
//   }

//   async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | null> {
//     const updatedEvent = await this.eventRepository.update(id, eventData);
//     return updatedEvent;
//   }

//   async deleteEvent(id: string): Promise<void> {
//     await this.eventRepository.delete(id);
//   }
}

