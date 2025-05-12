// src/company/company.service.ts

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateCompanyWithManagerDto } from './dto/create-company-with-manager.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../enum/role.enum';
import { randomBytes } from 'crypto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createCompanyWithManager(dto: CreateCompanyWithManagerDto): Promise<Company> {
    const { companyName, managerUsername, managerPassword } = dto;

    const companyCode = randomBytes(8).toString('hex');

    const existing = await this.companyRepository.findOne({ where: { code: companyCode } });
    while (existing) {
      const companyCode = randomBytes(8).toString('hex');

    const existing = await this.companyRepository.findOne({ where: { code: companyCode } });
    }

    const company = this.companyRepository.create({
      code: companyCode,
      name: companyName,
    });

    const savedCompany = await this.companyRepository.save(company);

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(managerPassword, salt);

    const manager = this.userRepository.create({
      username: managerUsername,
      password: hashedPassword,
      salt,
      role: Role.MANAGER,
      company: savedCompany,
    });

    await this.userRepository.save(manager);

    return savedCompany;
  }
}
