import { Test, TestingModule } from '@nestjs/testing';
import { HistoryGateway } from './history.gateway';
import { HistoryService } from './history.service';

describe('HistoryGateway', () => {
  let gateway: HistoryGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryGateway, HistoryService],
    }).compile();

    gateway = module.get<HistoryGateway>(HistoryGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
