import { Controller, UseGuards, Sse } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectedUser } from '../auth/decorator/user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Observable, of } from 'rxjs';
import { UserEvents } from './user.events';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userEvents: UserEvents
  ) {}

  @Sse('events')
  events(@ConnectedUser() user: JwtPayload): Observable<any> {
    if (!user.sub) {
      return of({ type: 'error', data: 'No user ID found' });
    }
    const stream = this.userEvents.getUserStream(user.sub.toString());
    if (!stream) {
      return of({ type: 'error', data: 'Stream not available' });
    }
    return stream;
  }
}
