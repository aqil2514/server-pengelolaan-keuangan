import { forwardRef, Module } from '@nestjs/common';
import { CategoryTransactionService } from './category-transaction.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => UtilsModule)],
  providers: [CategoryTransactionService],
  exports: [CategoryTransactionService],
})
export class CategoryTransactionModule {}
