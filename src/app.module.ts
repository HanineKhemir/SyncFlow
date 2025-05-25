// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule  } from '@nestjs/typeorm';
import { ConfigModule} from './config/config.module'; 
import { ConfigService } from './config/config.service';
import { User } from './user/entities/user.entity'; // Adjust path for your entities
import { NoteModule } from './note/note.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';
import { ScheduleModule } from './schedule/schedule.module';
import { CompanyModule } from './company/company.module';
import { NoteLine } from './note/entities/noteline.entity';
import { Task } from './task/entities/task.entity';
import { Schedule } from './schedule/entities/schedule.entity';
import { Company } from './company/entities/company.entity';
import { Note } from './note/entities/note.entity';
import { Operation } from './history/entities/operation.entity';
import { HistoryModule } from './history/history.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.getDatabaseConfig();
        return {
          type: 'mysql', 
          host: dbConfig.databaseHost,
          port: dbConfig.databasePort,
          username: dbConfig.databaseUsername,
          password: dbConfig.databasePassword,
          database: dbConfig.databaseName,
          entities: [User, Note, Task, Schedule, NoteLine, Company, Operation],
          synchronize: true, 
        };
      },
    }),
    EventEmitterModule.forRoot(),
    NoteModule, AuthModule, UserModule, TaskModule, ScheduleModule, CompanyModule, HistoryModule,
  ],
})
export class AppModule {}
