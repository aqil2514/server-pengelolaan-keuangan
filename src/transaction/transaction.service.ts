import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { TransactionUtilsService } from './utils/transaction-utils.service';
import { dummyTransactions } from './entity/dummy-data';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';
import { Transaction } from './entity/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly transactionUtilsService: TransactionUtilsService,
    private readonly httpResponseService: MakeHttpRespons
  ) {}
  private readonly logger = new Logger(TransactionService.name);

  async getTransaction(userId: string) {
    // const { user_transaction } = await this.supabaseService.getUserData(userId);
    // const transaction = this.transactionUtilsService.decryptTransaction(
    //   user_transaction,
    //   userId,
    // );

    const res = this.httpResponseService.success<Transaction[]>("Data berhasil diambil", dummyTransactions, 200);

    return res;
  }
}
