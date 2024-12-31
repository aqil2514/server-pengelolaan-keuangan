import { Test, TestingModule } from '@nestjs/testing';
import { DataTransformService } from './data-transform.service';

describe('DataTransformService', () => {
  let service: DataTransformService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataTransformService],
    }).compile();

    service = module.get<DataTransformService>(DataTransformService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
