import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { TransactionUtilsService } from './utils/transaction-utils.service';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Module({
  imports: [SupabaseModule],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionUtilsService, MakeHttpRespons],
  exports: [TransactionService]
})
export class TransactionModule {}
