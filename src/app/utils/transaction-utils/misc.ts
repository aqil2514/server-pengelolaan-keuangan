import {
  TransactionBodyType,
  TransactionType,
} from "../../../@types/Transaction";
import { AccountData } from "../../../@types/Account";
import CryptoJS from "crypto-js";
import { addNewTransaction } from "./manipulation";
import { getDecryptedTransactionData } from "./fetching";



/**
 * Fungsi untuk mengenkripsi data transaksi.
 *
 * @param transactionData - Data transaksi dalam bentuk string
 * @param key - Kunci yang digunakan untuk enkripsi
 * @returns Data transaksi terenkripsi dalam bentuk string
 */
export function encryptTransactionData(
  transactionData: string,
  key: string
): string {
  // Mengenkripsi data transaksi menggunakan enkripsi AES
  const encryptData = CryptoJS.AES.encrypt(transactionData, key).toString();

  // Mengembalikan data terenkripsi
  return encryptData;
}



export const setToMidnight = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export async function transactionAllocation(
  transactionData: AccountData | null,
  body: TransactionBodyType | TransactionBodyType[],
  dateTransaction: string
): Promise<TransactionType[] | undefined> {
  if (!transactionData?.user_transaction) return;

  const resource = String(transactionData.user_transaction);

  const transactions = getDecryptedTransactionData(
    resource,
    transactionData.userId
  );

  const selectedTransaction = transactions.find(
    (d) => new Date(d.header).toISOString() === dateTransaction
  );

  if (!selectedTransaction) {
    return addNewTransaction(dateTransaction, transactions, body);
  }

  if (Array.isArray(body)) {
    for (const b of body) {
      selectedTransaction.body.push(b);
    }
  } else {
    selectedTransaction.body.push(body);
  }

  return transactions;
}