import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Event  } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventService } from 'src/history/create-event.service';
import { OperationDto } from 'src/history/dto/operation.dto';
import { OperationType } from 'src/enum/operation-type';
import { SharedService } from 'src/services/shared.services';

@Injectable()
export class EventsService extends SharedService<Event> {
  constructor(
    @InjectRepository(Event)
    repo: Repository<Event>,
    createEventService: CreateEventService
  ) {
    super(repo, createEventService); // Pass to parent only, do not redeclare
  }

async create(dto: CreateEventDto) {
  const event = this.repository.create({
    ...dto,
    user: { id: dto.createdById }, // link user relation
  });
  const saved = await this.repository.save(event);

  const op: OperationDto = {
    type: OperationType.CREATE,
    userId: dto.createdById,
    data: saved,
  };

  await this.createEventService.createEvent(op);
  return saved;
}

  findAll() {
    return this.repository.find({relations: ['user']
 });
  }

  findOne(id: number) {
    return this.repository.findOne({ where: { id },relations: ['user']
 });
  }

  async getEventNamesByDate(date: Date): Promise<{ name: string; date: Date }[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await this.repository.find({
      where: {
        date: Between(startOfDay, endOfDay),
      },
      select: ['title', 'date'],
    });

    return events.map(event => ({
      name: event.title,
      date: event.date,
    }));
  }

  async update(id: number, dto: UpdateEventDto) {
    const event = await this.repository.preload({ id, ...dto });
    if (!event) throw new NotFoundException('Event not found');
    return this.repository.save(event);
  }

  async remove(id: number) {
    const result = await this.repository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Event not found');
  }

  async findTitles() {
    return this.repository.find({ select: ['id', 'title'] });
  }
}
