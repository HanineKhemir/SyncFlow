import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SharedService } from 'src/services/shared.services';

@Injectable()
export class UserService {
  @InjectRepository(User) private readonly repository : Repository<User>
  constructor() {
  }
  findOne(id: number) : Promise<User| null> {
    return this.repository.findOne({where: {id}, relations: ['company']});
  }
  getUserById(id: number) : Promise<User| null> {
    return this.repository.findOne({where: {id}});
  }

}
