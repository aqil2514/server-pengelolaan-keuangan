// import { forwardRef, Module } from '@nestjs/common';
// import { UtilsService } from './utils.service';
// import { TransactionModule } from 'src/transaction/transaction.module';
// import { SupabaseModule } from 'src/supabase/supabase.module';

// @Module({
//   imports: [forwardRef(() => TransactionModule), SupabaseModule],
//   providers: [UtilsService],
//   exports: [UtilsService],
// })
// export class UtilsModule {}

import { forwardRef, Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { TransactionModule } from 'src/transaction/transaction.module';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { CategoryTransactionModule } from 'src/category-transaction/category-transaction.module';
import { AssetsModule } from 'src/assets/assets.module';

@Module({
  imports: [
    forwardRef(() => TransactionModule), 
    forwardRef(() => CategoryTransactionModule), 
    forwardRef(() => AssetsModule), 
    SupabaseModule
  ], 
  providers: [UtilsService],
  exports: [UtilsService],  // Memastikan UtilsService diekspor
})
export class UtilsModule {}
