import { Injectable } from '@nestjs/common';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { Subject, Observable, filter, map } from 'rxjs';
import { Role } from 'src/enum/role.enum';
import { UserService } from 'src/user/user.service';
import { Operation } from './entities/operation.entity';
import { OperationDto } from './dto/operation.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyService } from 'src/company/company.service';
import { Company } from 'src/company/entities/company.entity';

@Injectable()
export class HistoryService {
  private events = new Subject<Operation>();
  @InjectRepository(Operation) private readonly repo: Repository<Operation>
  @InjectRepository(Company) private readonly companyRepo: Repository<Company>
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

  async getHistory(companyCode:string, limit:number=0, start:number=0): Promise<any[]> {
    const company = await this.companyRepo.findOne({
      where: { code: companyCode },
    });
    if (!company) {
      throw new Error('Company not found');
    }

    const raw  = await this.repo
      .createQueryBuilder('operation')
      .where('operation.companyId = :companyId', { companyId: company.id })
      .where("deletedAt IS NULL")
      .select(['operation.id', 'operation.type', 'operation.date', 'operation.description', "operation.targettype", "operation.target"])
      .addSelect('operation.performedById', 'performedById')
      .orderBy('operation.id', 'ASC')
      .take(limit > 0 ? limit : undefined)
      .skip(start > 0 ? start : undefined)
      .getRawMany();
      console.log(raw);
    const operations = 
      raw.map((item) => ({
          id: item.operation_id,
          type: item.operation_type,
          date: item.operation_date,
          description: item.operation_description,
          targettype: item.operation_targettype,
          target: item.operation_target,
          performedById: item.performedById,
      }));
    return operations;

  }
}
