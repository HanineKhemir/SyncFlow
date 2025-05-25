import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Company } from './entities/company.entity';
import { HistoryModule } from 'src/history/history.module';
@Module({
  controllers: [CompanyController],
  imports: [TypeOrmModule.forFeature([Company, User]), HistoryModule], 
  providers: [CompanyService],
  exports: [CompanyService],})
export class CompanyModule {}
