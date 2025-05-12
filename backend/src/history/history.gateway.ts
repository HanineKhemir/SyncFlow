import { WebSocketGateway } from '@nestjs/websockets';
import { HistoryService } from './history.service';

@WebSocketGateway()
export class HistoryGateway {
  constructor(private readonly historyService: HistoryService) {}
}
