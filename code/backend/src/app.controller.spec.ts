import { PrismaService } from './prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: {} },
        { provide: 'JwtService', useValue: {} },
        { provide: 'ConfigService', useValue: {} },
        { provide: 'AuthService', useValue: {} },
        { provide: 'UsersService', useValue: {} },
        { provide: 'NotificationsService', useValue: {} },
        { provide: 'GamificationService', useValue: {} },
        { provide: 'SchedulesService', useValue: {} },
        { provide: 'CalendarService', useValue: {} },
        { provide: 'MessagesService', useValue: {} },
        { provide: 'ProposalsService', useValue: {} },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
