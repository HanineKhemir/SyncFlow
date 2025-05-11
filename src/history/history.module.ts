import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryGateway } from './history.gateway';

@Module({
  providers: [HistoryGateway, HistoryService],
})
export class HistoryModule {}
