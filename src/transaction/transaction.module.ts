import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { TransactionUtilsService } from './utils/transaction-utils.service';

@Module({
  imports: [SupabaseModule],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionUtilsService],
  exports: [TransactionService]
})
export class TransactionModule {}
