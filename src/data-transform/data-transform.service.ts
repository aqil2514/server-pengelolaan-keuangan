import { Injectable } from '@nestjs/common';
import {
  ClientTransactionAddFormData,
  Transaction,
} from 'src/transaction/entity/transaction.entity';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class DataTransformService {
  constructor(private readonly utilsService: UtilsService) {}

  async convertTransactionDataToServerFormat(
    data: ClientTransactionAddFormData,
  ): Promise<Transaction> {
    const userId = data.userId;

    const result: Transaction = {
      category_id: 'trc-001',
      id: await this.utilsService.createTransactionId(userId),
      userId,
      created_at: new Date(),
      name_transaction: data.noteTransaction,
      transaction_at: data.dateTransaction,
      type_transaction: data.typeTransaction,
      updated_at: new Date(),
      description: data.descriptionTransaction,
      nominal: {
        account_id: 'acc-001',
        amount: data.totalTransaction,
      },
    };

    return result;
  }
}
