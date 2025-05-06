import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  imports: [TasksModule, NotificationsModule, MessagesModule, UsersModule, SchedulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
