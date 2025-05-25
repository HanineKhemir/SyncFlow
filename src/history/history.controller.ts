import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Sse } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/role-guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/enum/role.enum';
import { ConnectedUser } from 'src/auth/decorator/user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { Operation } from './entities/operation.entity';
import { create } from 'domain';
import { Observable } from 'rxjs';

@Controller('history')
@UseGuards(JwtAuthGuard)
@UseGuards(RolesGuard)
@Roles([Role.MANAGER])
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}
  @Sse('events')
  events(@ConnectedUser() user: JwtPayload) : Observable<MessageEvent> {
    return new Observable<MessageEvent>(observer => {
      this.historyService.getStream(user).then(stream => {
        stream.subscribe({
          next: (event) => observer.next(event),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      }).catch(err => observer.error(err));
    });
  }
  }

//   @Post()
//   create(@Body() createHistoryDto: CreateHistoryDto) {
//     return this.historyService.create(createHistoryDto);}

//   @Get()
//   findAll() {
//     return this.historyService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.historyService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateHistoryDto: UpdateHistoryDto) {
//     return this.historyService.update(+id, updateHistoryDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.historyService.remove(+id);
//   }
// }
