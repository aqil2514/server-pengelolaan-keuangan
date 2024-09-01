import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { TransactionUtilsService } from './utils/transaction-utils.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly transactionUtilsService: TransactionUtilsService,
  ) {}
  private readonly logger = new Logger(TransactionService.name);

  async getTransaction(userId: string) {
    const { user_transaction } = await this.supabaseService.getUserData(userId);
    const transaction = this.transactionUtilsService.decryptTransaction(
      user_transaction,
      userId,
    );

    return console.log(transaction);
  }
}
