import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { CreateEventService } from './create-event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entities/operation.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [HistoryController],
  providers: [HistoryService, CreateEventService],
  imports : [TypeOrmModule.forFeature([Operation]), UserModule], 
  exports: [CreateEventService],
})
export class HistoryModule {}
