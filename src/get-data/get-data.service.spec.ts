import { Test, TestingModule } from '@nestjs/testing';
import { GetDataService } from './get-data.service';

describe('GetDataService', () => {
  let service: GetDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetDataService],
    }).compile();

    service = module.get<GetDataService>(GetDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
