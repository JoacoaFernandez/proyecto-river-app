import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: { news: { findMany: jest.fn().mockResolvedValue([]) }, match: { findMany: jest.fn().mockResolvedValue([]) } } },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return notifications array', async () => {
    const result = await appController.getNotifications();
    expect(Array.isArray(result)).toBe(true);
  });
});
