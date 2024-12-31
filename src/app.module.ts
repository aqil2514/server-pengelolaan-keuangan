import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TransactionModule } from './transaction/transaction.module';
import { AssetsModule } from './assets/assets.module';
import { SharedModule } from './shared/shared.module';
import { DataTransformModule } from './data-transform/data-transform.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    AuthModule,
    TransactionModule,
    AssetsModule,
    SharedModule,
    DataTransformModule,
    UtilsModule,
  ],
  controllers: [AppController], // Hanya controller utama
  providers: [AppService],      // Hanya service utama
})
export class AppModule {}
