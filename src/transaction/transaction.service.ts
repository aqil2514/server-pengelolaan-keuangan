import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
// import { dummyTransactions } from './entity/dummy-data';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';
import { ClientTransactionAddFormData } from './entity/transaction.entity';
import { UtilsService } from 'src/utils/utils.service';
import { DataTransformService } from 'src/data-transform/data-transform.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly utilsService: UtilsService,
    private readonly dataTransformService: DataTransformService,
    private readonly httpResponseService: MakeHttpRespons,
  ) {}
  private readonly logger = new Logger(TransactionService.name);

  async getTransaction(userId: string) {
    const { user_transaction } = await this.supabaseService.getUserData(userId);

    this.logger.log('Dekripsi dimulai');
    const transaction = this.utilsService.decryptTransaction(
      user_transaction,
      userId,
    );

    return { transaction };
  }

  async addTransactionData(data: ClientTransactionAddFormData) {
    const transaction =
      await this.dataTransformService.convertTransactionDataToServerFormat(
        data,
      );

    return transaction;
  }
}
