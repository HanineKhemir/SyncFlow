import { Controller, UseGuards } from '@nestjs/common';
import { Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Roles } from './decorator/roles.decorator';
import { ConnectedUser } from './decorator/user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../user/entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';
import { JwtAuthGuard } from './jwt-auth.guard';
import path from 'path';
import { LoginDto } from './dto/login.dto';
import { Role } from 'src/enum/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UseGuards(JwtAuthGuard) 
  @Post('create-user')
  @Roles([Role.MANAGER]) 
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @ConnectedUser() manager: JwtPayload
  ) {
    return this.authService.createUser(createUserDto, manager);
  }
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(loginDto);
  }
}
