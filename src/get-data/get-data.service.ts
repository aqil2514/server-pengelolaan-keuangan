import { Injectable, Logger } from '@nestjs/common';
import { GetDataQuery } from './entity/get-data.entity';
import { TransactionService } from 'src/transaction/transaction.service';
import { AssetsService } from 'src/assets/assets.service';

@Injectable()
export class GetDataService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly assetsService: AssetsService,
  ) {}
  private readonly logger = new Logger(GetDataService.name);
  async getData(query: GetDataQuery, id: string) {
    this.logger.log(`Mengambil data dengan query ${query}`);
    if (query === 'asset') return await this.assetsService.getAssets(id);
    if (query === 'transaction')
      return await this.transactionService.getTransaction(id);
    const { transaction } = await this.transactionService.getTransaction(id);
    const { accounts, categories } = await this.assetsService.getAssets(id);

    return {
      transaction,
      accounts,
      categories,
    };
  }
}
