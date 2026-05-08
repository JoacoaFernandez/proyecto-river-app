import { Test, TestingModule } from '@nestjs/testing';
import { FormationsController } from './formations.controller';

describe('FormationsController', () => {
  let controller: FormationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormationsController],
    }).compile();

    controller = module.get<FormationsController>(FormationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
