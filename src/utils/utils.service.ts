import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'src/transaction/entity/transaction.entity';
import * as CryptoJS from 'crypto-js';
import { TransactionService } from 'src/transaction/transaction.service';
import { Category } from 'src/assets/entity/category.entity';
import { CategoryTransactionService } from 'src/category-transaction/category-transaction.service';
import { AssetsService } from 'src/assets/assets.service';
import { Accounts } from 'src/assets/entity/account.entity';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  constructor(
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => CategoryTransactionService))
    private readonly categoryTransactionService: CategoryTransactionService,
    @Inject(forwardRef(() => AssetsService))
    private readonly assetService: AssetsService,
  ) {}

  decryptCategory(encryptedData: string, userId: string): Category[] {
    if (!encryptedData) {
      this.logger.log('Data Category yang diterima kosong atau tidak ada.', "Mengembalikan array kosong");
      return [];
    }

    this.logger.log('Data category tersedia', "Mulai dekripsi data category");

    const category = JSON.parse(
      CryptoJS.AES.decrypt(encryptedData, userId).toString(CryptoJS.enc.Utf8),
    );
    this.logger.log('Data category berhasil didekripsi.');

    return category;
  }

  decryptTransaction(encryptedData: string, userId: string): Transaction[] {
    if (!encryptedData) {
      this.logger.log('Data transaction yang diterima kosong atau tidak ada.', "Mengembalikan array kosong");
      return [];
    }

    this.logger.log('Data transaction tersedia', "Mulai dekripsi data transaction");
    const transaction = JSON.parse(
      CryptoJS.AES.decrypt(encryptedData, userId).toString(CryptoJS.enc.Utf8),
    );
    this.logger.log('Data transaction berhasil didekripsi.');

    return transaction;
  }

  decryptAssets(encryptedData: string, userId: string): Accounts[] {
    if (!encryptedData) {
      this.logger.log('Data asset yang diterima kosong atau tidak ada.', "Mengembalikan array kosong");
      return [];
    }

    this.logger.log('Data asset tersedia', "Mulai dekripsi data asset");
    const assets = JSON.parse(
      CryptoJS.AES.decrypt(encryptedData, userId).toString(CryptoJS.enc.Utf8),
    );
    this.logger.log('Data asset berhasil didekripsi.');

    return assets;
  }

  async createTransactionId(userId: string): Promise<`tr-${string}`> {
    this.logger.log("Membuat Id baru untuk transaksi")
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
    this.logger.log("Id Transaksi berhasil dibuat")
    return transactionId as `tr-${string}`;
  }

  async createCategoryId(userId: string): Promise<`trc-${string}`> {
    this.logger.log("Membuat Id baru untuk category")
    const categories =
      await this.categoryTransactionService.getCategories(userId);

    // Ekstrak id yang ada dan convert ke dalam nomor
    const existingNumbers = categories
      .map((cat) => {
        const match = cat.category_id.match(/trc-(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num): num is number => num !== null);

    // Temukan angka paling kecil yang hilang dalam urutan
    let nextCategoryNumber = 1; 
    while (existingNumbers.includes(nextCategoryNumber)) {
      nextCategoryNumber++;
    }

    // Jadikan nomor menjadi 3 digit (contoh, 001, 002, dst)
    const categoryNumber = nextCategoryNumber.toString().padStart(3, '0');

    const categoryId: `trc-${string}` = `trc-${categoryNumber}`;

    this.logger.log("Pembuatan Id untuk category berhasil")
    return categoryId;
  }

  async createAssetId(userId: string): Promise<`acc-${string}`> {
    const assets =
      await this.assetService.getAssets(userId);

    // Ekstrak id yang ada dan convert ke dalam nomor
    const existingNumbers = assets
      .map((acc) => {
        const match = acc.account_id.match(/trc-(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num): num is number => num !== null);

    // Temukan angka paling kecil yang hilang dalam urutan
    let nextAssetNumber = 1; 
    while (existingNumbers.includes(nextAssetNumber)) {
      nextAssetNumber++;
    }

    // Jadikan nomor menjadi 3 digit (contoh, 001, 002, dst)
    const assetNumber = nextAssetNumber.toString().padStart(3, '0');

    const assetId: `acc-${string}` = `acc-${assetNumber}`;

    this.logger.log("Pembuatan Id untuk category berhasil")
    return assetId;
  }
}
