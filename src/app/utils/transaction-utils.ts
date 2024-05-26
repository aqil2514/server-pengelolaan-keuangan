import { ZodError, ZodIssue, isValid, z } from "zod";
import {
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
} from "../../@types/Transaction";
import { Account, AccountData } from "../../@types/Account";
import CryptoJS from "crypto-js";
import supabase from "../lib/db";

export async function transactionAllocation(
  transactionData: AccountData | null,
  body: TransactionBodyType,
  dateTransaction: string
) {
  if (!transactionData) return;

  let result: TransactionType[] = [];

  const resource = transactionData.user_transaction;
  const decryptData = CryptoJS.AES.decrypt(
    resource,
    transactionData.userId
  ).toString(CryptoJS.enc.Utf8);
  const transactions: TransactionType | TransactionType[] =
    JSON.parse(decryptData);

  if (Array.isArray(transactions)) result = transactions;
  else result.push(transactions);

  const selectedTransaction = result.find(
    (d) => new Date(d.header).toISOString() === dateTransaction
  );

  if (!selectedTransaction) {
    const newDate: TransactionType = {
      id: crypto.randomUUID(),
      header: dateTransaction,
      body: [],
    };

    newDate.body.push(body);
    result.push(newDate);

    return result;
  }

  selectedTransaction.body.push(body);

  return result;
}

export function getTransactionData(transactionData:string, key:string){
  const decryptData = CryptoJS.AES.decrypt(transactionData, key).toString(CryptoJS.enc.Utf8);
  const result:TransactionType[] = JSON.parse(decryptData);

  return result;
}

export function encryptTransactionData(transactionData:string, key:string){
  const encryptData = CryptoJS.AES.encrypt(transactionData, key).toString();

  return encryptData;
}

const TransactionFormDataSchema = z.object({
  typeTransaction: z.enum(["Pemasukan", "Pengeluaran"], {
    message: "Tipe transaksi tidak diizinkan",
  }),
  totalTransaction: z.number({ message: "Total transaksi harus berupa angka" }),
  dateTransaction: z.string({ message: "Transaksi harus berupa tanggal" }),
  categoryTransaction: z.string().min(1, "Category transaksi belum diisi"),
  assetsTransaction: z.string().min(1, "Aset transaksi belum diisi"),
  noteTransaction: z.string().min(1, "Catatan transaksi belum diisi"),
});

export function validateTransaction(formData: TransactionFormData) {
  try {
    TransactionFormDataSchema.parse(formData);
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { isValid: false, error };
    }
  }

  return { isValid: false };
}
