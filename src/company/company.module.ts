import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Company } from './entities/company.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Company, User])], // ✅ Register entities for DI
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [TypeOrmModule], // ✅ Export if other modules need these repositories
})
export class CompanyModule {}
