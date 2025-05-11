import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module'; // ✅ import AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule, // ✅ fix: bring in AuthService from AuthModule
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
