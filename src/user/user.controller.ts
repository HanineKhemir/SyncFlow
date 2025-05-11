import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Role } from './enum/role.enum';
import { ConnectedUser } from 'src/auth/decorator/user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { AuthService } from 'src/auth/auth.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService, // ✅ lowercase name
  ) {}

  @Roles([Role.MANAGER])
  @Post()
  async createUser(
    @Body() dto: CreateUserDto,
    @ConnectedUser() user: JwtPayload,
  ) {
    return this.authService.createUser(dto, user); // ✅ corrected usage
  }
}
