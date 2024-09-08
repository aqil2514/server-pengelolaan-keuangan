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

@Module({
  imports: [AuthModule, TransactionModule, AssetsModule, SharedModule],
  controllers: [AppController, TransactionController, AssetsController],
  providers: [AppService, AssetsService],
})
export class AppModule {}
