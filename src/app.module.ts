// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { AuthModule } from './auth/auth.module';
// import { TransactionController } from './transaction/transaction.controller';
// import { TransactionModule } from './transaction/transaction.module';
// import { AssetsController } from './assets/assets.controller';
// import { AssetsService } from './assets/assets.service';
// import { AssetsModule } from './assets/assets.module';
// import { SharedModule } from './shared/shared.module';
// import { DataTransformModule } from './data-transform/data-transform.module';
// import { UtilsModule } from './utils/utils.module';

// @Module({
//   imports: [
//     AssetsModule, 
//     AuthModule, 
//     DataTransformModule, 
//     SharedModule, 
//     TransactionModule, 
//     UtilsModule
//   ],
//   controllers: [AppController, TransactionController, AssetsController],
//   providers: [AppService, AssetsService],
// })
// export class AppModule {}

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
    AssetsModule, 
    AuthModule, 
    DataTransformModule, 
    SharedModule, 
    TransactionModule, 
    UtilsModule,  // Memastikan kedua module diimpor
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
