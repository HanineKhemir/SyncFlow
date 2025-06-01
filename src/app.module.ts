// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule  } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module'; 
import { ConfigService } from './config/config.service';
import { User } from './user/entities/user.entity';
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
import { Event } from './events/entities/event.entity';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { EventsModule } from './events/events.module'; // ← your new module
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

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
          entities: [User, Note, Task, Schedule, NoteLine, Company, Operation,Event],
          synchronize: true,
        };
      },
    }),

    EventEmitterModule.forRoot(),

 

    // Feature modules
    NoteModule,
    AuthModule,
    UserModule,
    TaskModule,
    ScheduleModule,
    CompanyModule,
    HistoryModule,
    EventsModule 
  ],
})
export class AppModule {}
