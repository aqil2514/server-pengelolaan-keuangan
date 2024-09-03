// export interface TransactionType {
//   id?: string;
//   header: string;
//   body: TransactionBodyType[];
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface TransactionBodyType {
//   uid: string;
//   category: string;
//   asset: string;
//   item: string;
//   price: number;
//   description?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

export type TransactionId = `tr-${string}`;

/** Interface untuk transaksi */
export interface Transaction {
  /** ID Transaksi */
  id: TransactionId;
  /** Transaksi dibuat pada tanggal */
  created_at: Date;
  /** Transaksi diupdate pada tanggal */
  updated_at: Date;
  /** Transaksi diupdate pada tanggal */
  transaction_at: Date;
  /** Nama transaksi */
  name_transaction: string;
  /** Penjelasan transaksi */
  description?: string;
  /** Tipe transaksi */
  type_transaction: 'Income' | 'Outcome' | 'Transfer';
  /** Kategori ID */
  category_id: `trc-${string}`;
  /** Tag Transaksi */
  tag?: string[];
  /** Informasi tambahan, seperti foto, pdf, atau link */
  attachment?: string;
  /** Nominal transaksi */
  nominal: {
    /** Asal akun */
    account_id: `acc-${string}`;
    /** Jumlah transaksi */
    amount: number;
    /** Mata uang */
    currency: string;
  };
}