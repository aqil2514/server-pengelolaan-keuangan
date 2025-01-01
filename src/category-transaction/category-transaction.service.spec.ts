import { Test, TestingModule } from '@nestjs/testing';
import { CategoryTransactionService } from './category-transaction.service';

describe('CategoryTransactionService', () => {
  let service: CategoryTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryTransactionService],
    }).compile();

    service = module.get<CategoryTransactionService>(CategoryTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
