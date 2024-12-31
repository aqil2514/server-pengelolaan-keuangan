// import { forwardRef, Module } from '@nestjs/common';
// import { TransactionService } from './transaction.service';
// import { TransactionController } from './transaction.controller';
// import { SupabaseModule } from 'src/supabase/supabase.module';
// import { MakeHttpRespons } from 'src/shared/httpResponse.utils';
// import { UtilsModule } from 'src/utils/utils.module';

// @Module({
//   imports: [SupabaseModule, forwardRef(() => UtilsModule)],
//   controllers: [TransactionController],
//   providers: [TransactionService, MakeHttpRespons],
//   exports: [TransactionService], // Memastikan TransactionService diekspor
// })
// export class TransactionModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { UtilsModule } from 'src/utils/utils.module';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';
import { DataTransformModule } from 'src/data-transform/data-transform.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => UtilsModule), DataTransformModule],  // Memastikan import forwardRef untuk circular dependency
  controllers: [TransactionController],
  providers: [TransactionService, MakeHttpRespons],
  exports: [TransactionService],  // Memastikan TransactionService diekspor
})
export class TransactionModule {}
