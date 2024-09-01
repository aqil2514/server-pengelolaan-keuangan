import { Injectable, Logger } from '@nestjs/common';
import { TransactionType } from '../entity/transaction.entity';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class TransactionUtilsService {
  private readonly logger = new Logger(TransactionUtilsService.name);

  decryptTransaction(encryptedData: string, userId: string): TransactionType[] {
    const transaction = JSON.parse(
      CryptoJS.AES.decrypt(encryptedData, userId).toString(CryptoJS.enc.Utf8),
    );

    return transaction;
  }
}
