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

  async findByDate(date: Date): Promise<Event[]> {
    // Format date to yyyy-mm-dd for comparison
    const dateStr = date.toISOString().split('T')[0];
    
    return this.repository.createQueryBuilder('event')
      .where('DATE(event.date) = :dateStr', { dateStr })
      .getMany();
  }

  async getEventTitlesByDate(companyCode: string, date: string) {
  return this.repository
    .createQueryBuilder('event')
    .innerJoin('event.user', 'user')
    .innerJoin('user.company', 'company')
    .where('company.code = :code', { code: companyCode })
    .andWhere('event.date = :date', { date })
    .select(['event.title', 'event.date'])
    .getRawMany();
}


async getUpcomingWeekEvents(companyCode: string, startDate: string) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return this.repository
    .createQueryBuilder('event')
    .innerJoin('event.user', 'user')
    .innerJoin('user.company', 'company')
    .where('company.code = :code', { code: companyCode })
    .andWhere('event.date BETWEEN :start AND :end', { start, end })
    .select(['event.title', 'event.date'])
    .getRawMany();
}

async getUpcomingMonthEvents(companyCode: string, startDate: string) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  end.setDate(end.getDate() - 1); 
  return this.repository
    .createQueryBuilder('event')
    .innerJoin('event.user', 'user')
    .innerJoin('user.company', 'company')
    .where('company.code = :code', { code: companyCode })
    .andWhere('event.date BETWEEN :start AND :end', { start, end })
    .select(['event.title', 'event.date'])
    .getRawMany();  
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
