import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'src/transaction/entity/transaction.entity';
import * as CryptoJS from 'crypto-js';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  constructor(
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
  ) {}

  decryptTransaction(encryptedData: string, userId: string): Transaction[] {
    if (!encryptedData) {
      this.logger.log('Data yang diterima kosong atau tidak ada.');
      return [];
    }

    this.logger.log('Ada data yang terdeteksi.');
    const transaction = JSON.parse(
      CryptoJS.AES.decrypt(encryptedData, userId).toString(CryptoJS.enc.Utf8),
    );
    this.logger.log('Data berhasil didekripsi.');

    return transaction;
  }

  async createTransactionId(userId: string): Promise<`tr-${string}`> {
    // Get the current date
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    // Build the base transaction ID (e.g., tr-241201 for December 1st, 2024)
    const baseTransactionId = `tr-${year}${month}${day}`;

    // Get all transactions for today (assuming getTransactionsByDate returns a list of transactions for the given user and date)
    const { transaction } =
      await this.transactionService.getTransaction(userId);

    const todayTransactions = transaction.filter((tran) => {
      const createdAt = new Date(tran.created_at);
      return createdAt >= startOfDay && createdAt <= endOfDay;
    });

    // Determine the next transaction number (starting from 1 if no transactions today)
    const nextTransactionNumber = todayTransactions.length + 1;
    const transactionNumber = nextTransactionNumber.toString().padStart(2, '0'); // Pad to 2 digits (e.g., 01, 02, etc.)

    // Build the final transaction ID
    const transactionId = `${baseTransactionId}${transactionNumber}`;

    // Return the transaction ID
    return transactionId as `tr-${string}`;
  }
}
