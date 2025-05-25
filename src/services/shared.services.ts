import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ObjectLiteral,
  Repository,
  DeepPartial,
  FindOptionsWhere,
} from 'typeorm';
import { PaginationDto } from './pagination.dto';
import { Role } from 'src/enum/role.enum';
import { User } from 'src/user/entities/user.entity';
import { use } from 'passport';

@Injectable()
export class SharedService<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(filter? : PaginationDto,user?:any): Promise<T[]> {
    try {
      const options: any = {};
      

      if (user?.role !== 'admin') {
        options.where = { user : {id: user?.userId} } as any;
      }
  
      if (filter?.limit !== undefined && filter?.offset !== undefined) {
        options.take = filter.limit;
        options.skip = filter.offset;
      }
  
      return await this.repository.find(options);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while retrieving the entities',
      );
    }
  }

  async findOne(id: number): Promise<T | null > {
    try {
      const where = { id } as unknown as FindOptionsWhere<T>;
      const entity = await this.repository.findOne({ where });
      if (!entity) {
        throw new NotFoundException(`Entity with id ${id} not found`);
      }
      return entity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `An error occurred while retrieving the entity with id ${id}`,
      );
    }
  }

  async create(data: DeepPartial<T>,userID?): Promise<T | null> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the entity',
      );
    }
  }

  async update(id: number, data: DeepPartial<T>,userID?): Promise<T | null> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    const updated = this.repository.create({
      ...entity,
      ...data,
    });
    return this.repository.save(updated);
  }

  async delete(id: number,userID?): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }
}
