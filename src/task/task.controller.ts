import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Sse } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectedUser } from '../auth/decorator/user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Observable, of } from 'rxjs';
import { TaskEvents } from './task.events';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskEvents: TaskEvents
  ) {}

  @Sse('events')
  events(@ConnectedUser() user: JwtPayload): Observable<any> {
    if (!user.sub) {
      return of({ type: 'error', data: 'No user ID found' });
    }
    const stream = this.taskEvents.getUserStream(user.sub.toString());
    if (!stream) {
      return of({ type: 'error', data: 'Stream not available' });
    }
    return stream;
  }

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @ConnectedUser() user: JwtPayload
  ) {
    return this.taskService.create(createTaskDto, user);
  }

  @Get()
  findAll(@ConnectedUser() user: JwtPayload) {
    return this.taskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ConnectedUser() user: JwtPayload) {
    return this.taskService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateTaskDto: UpdateTaskDto,
    @ConnectedUser() user: JwtPayload
  ) {
    return this.taskService.update(+id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ConnectedUser() user: JwtPayload) {
    return this.taskService.remove(+id, user);
  }

  @Get('user/:userId')
  getTasksByUser(@Param('userId') userId: string) {
    return this.taskService.getTasksByUser(+userId);
  }

  @Get('company/:companyId')
  getTasksByCompany(@Param('companyId') companyId: string) {
    return this.taskService.getTasksByCompany(+companyId);
  }
}
