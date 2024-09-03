import { Injectable, Logger } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { Transaction } from '../entity/transaction.entity';

@Injectable()
export class TransactionUtilsService {
  private readonly logger = new Logger(TransactionUtilsService.name);

  decryptTransaction(encryptedData: string, userId: string): Transaction[] {
    const transaction = JSON.parse(
      CryptoJS.AES.decrypt(encryptedData, userId).toString(CryptoJS.enc.Utf8),
    );

    return transaction;
  }
}
