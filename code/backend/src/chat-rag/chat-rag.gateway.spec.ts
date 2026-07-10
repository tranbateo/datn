import { Test, TestingModule } from '@nestjs/testing';
import { ChatRagGateway } from './chat-rag.gateway';

describe('ChatRagGateway', () => {
  let gateway: ChatRagGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatRagGateway],
    }).compile();

    gateway = module.get<ChatRagGateway>(ChatRagGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
