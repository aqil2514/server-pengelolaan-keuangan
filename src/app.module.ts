import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TransactionController } from './transaction/transaction.controller';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [AuthModule, TransactionModule],
  controllers: [AppController, TransactionController],
  providers: [AppService],
})
export class AppModule {}
