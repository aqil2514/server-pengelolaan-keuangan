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

@Module({
  imports: [forwardRef(() => TransactionModule), SupabaseModule],  // Menggunakan forwardRef untuk circular dependency
  providers: [UtilsService],
  exports: [UtilsService],  // Memastikan UtilsService diekspor
})
export class UtilsModule {}
