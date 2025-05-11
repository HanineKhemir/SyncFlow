import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { CompanyModule } from '../company/company.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User]), TypeOrmModule.forFeature([User]),PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  })],
  exports: [AuthService],
  providers: [AuthService, JwtStrategy],

  controllers: [AuthController]
})
export class AuthModule {}
