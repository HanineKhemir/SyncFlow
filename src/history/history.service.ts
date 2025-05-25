import { Injectable } from '@nestjs/common';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { Subject, Observable, filter, map } from 'rxjs';
import { Role } from 'src/enum/role.enum';
import { UserService } from 'src/user/user.service';
import { Operation } from './entities/operation.entity';
import { OperationDto } from './dto/operation.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class HistoryService {
  private events = new Subject<Operation>();
  constructor(
    private readonly userService: UserService
  ) {}
  async getStream(_user: JwtPayload): Promise<Observable<MessageEvent<any>>> {

    const user : User | null = await this.userService.findOne(_user.sub);
    if(!user) {
      throw new Error('User not found');
    }
    return this.events.asObservable().pipe(
      filter((event: Operation): boolean => {
        if(event.performedBy.company.id !== user.company.id) return false;
        if (_user.role === Role.MANAGER) return true;
        return false;
      }),
      map((event: Operation) => {
        return {
          data: JSON.stringify(event),
        } as MessageEvent;
      }),
    );
  }

  findAll() {
    return `This action returns all history`;
  }
}
