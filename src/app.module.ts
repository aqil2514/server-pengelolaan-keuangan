import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TransactionController } from './transaction/transaction.controller';
import { TransactionModule } from './transaction/transaction.module';
import { AssetsController } from './assets/assets.controller';
import { AssetsService } from './assets/assets.service';
import { AssetsModule } from './assets/assets.module';
import { SharedModule } from './shared/shared.module';
import { GetDataController } from './get-data/get-data.controller';
import { GetDataModule } from './get-data/get-data.module';
import { GetDataService } from './get-data/get-data.service';

@Module({
  imports: [AuthModule, TransactionModule, AssetsModule, SharedModule, GetDataModule],
  controllers: [AppController, TransactionController, AssetsController, GetDataController],
  providers: [AppService, AssetsService, GetDataService],
})
export class AppModule {}
