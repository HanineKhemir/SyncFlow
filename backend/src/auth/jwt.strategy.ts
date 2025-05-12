import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.interface'; // Create this interface to define JWT payload structure
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity'; // Adjust path

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in the .env file');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, 
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId, username, companyCode } = payload;

    const user = await this.userRepository.findOne({
      where: { id: userId, username },
      relations: ['company'], 
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { userId: user.id, username: user.username, companyCode: user.company?.code };
  }
}
