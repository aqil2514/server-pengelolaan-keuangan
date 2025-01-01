import { Injectable, Logger } from '@nestjs/common';
import {
  ClientTransactionAddFormData,
  Transaction,
} from 'src/transaction/entity/transaction.entity';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class DataTransformService {
  private readonly logger = new Logger(DataTransformService.name)
  constructor(private readonly utilsService: UtilsService) {}

  async convertTransactionDataToServerFormat(
    data: ClientTransactionAddFormData,
  ): Promise<Transaction> {

    this.logger.log("Data dari client diterima", "Mengubah data ke bentuk yang diterima server")

    const userId = data.userId;

    const result: Transaction = {
      category_id: await this.utilsService.createCategoryId(userId),
      id: await this.utilsService.createTransactionId(userId),
      userId,
      created_at: new Date(),
      name_transaction: data.noteTransaction,
      transaction_at: data.dateTransaction,
      type_transaction: data.typeTransaction,
      updated_at: new Date(),
      description: data.descriptionTransaction,
      nominal: {
        account_id: await this.utilsService.createAssetId(userId),
        amount: data.totalTransaction,
      },
    };

    this.logger.log("Proses selesai", "Mengembalikan ke client")

    return result;
  }
}
