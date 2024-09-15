import { Module } from '@nestjs/common';
import { GetDataService } from './get-data.service';
import { TransactionModule } from 'src/transaction/transaction.module';
import { AssetsModule } from 'src/assets/assets.module';
import { GetDataController } from './get-data.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  providers: [GetDataService],
  imports: [TransactionModule, AssetsModule, SharedModule],
  controllers: [GetDataController],
})
export class GetDataModule {}
