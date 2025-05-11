import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Company } from '../company/entities/company.entity';
import { Role } from '../user/enum/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtPayload } from './jwt-payload.interface';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) {}
async createUser(createUserDto: CreateUserDto, manager: JwtPayload): Promise<User> {
  const { username, password, role } = createUserDto;

  const company = await this.userRepository.manager
    .getRepository(Company)
    .findOne({ where: { code: manager.companyCode } });
  if (!company) {
    throw new UnauthorizedException('Invalid company code');
  }
  const existing = await this.userRepository.findOne({ where: { username, company: { id: company.id } } });
  if (existing) {
    throw new UnauthorizedException('Username already exists in this company');
  }
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = this.userRepository.create({
    username,
    password: hashedPassword,
    salt,
    company,
    role: role ?? Role.USER,
  });

  return this.userRepository.save(user);
}
  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { username, password, companyCode } = loginDto;
    const company = await this.userRepository.manager
      .getRepository(Company)
      .findOne({ where: { code: companyCode}, relations: ['users'] });

    if (!company) {
      throw new UnauthorizedException('Invalid company code');
    }

    const user = await this.userRepository.findOne({ 
      where: { username, company: { id: company.id } } 
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { username: user.username, sub: user.id, role: user.role, companyId: company.id };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
