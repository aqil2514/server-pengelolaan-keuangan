import { ZodError } from "zod";
import { AccountData } from "./Account";
import { BasicResponse } from "./General";

export interface ErrorsTransaction {
  type: string;
  total: string;
  date: string;
}

export interface HandleTransactionProps {
  income: (
    formData: TransactionFormData,
    userData: AccountData
  ) => Promise<TransactionBasicResponse>;
}

export interface TransactionBasicResponse extends BasicResponse<T> {}

export interface TransactionBodyType {
  uid?: string;
  category: string;
  asset: string;
  item: string;
  price: number;
}

export interface TransactionType {
  id?: string;
  header: string;
  body: TransactionBodyType[];
}

export interface TransactionFormData {
  userId: string;
  idTransaction: string;
  uidTransaction: string;
  typeTransaction: TypeTransaction;
  totalTransaction: number;
  dateTransaction: Date;
  categoryTransaction: string;
  assetsTransaction: string;
  noteTransaction: string;
  price: number;
  fromAsset: string;
  toAsset: string;
  descriptionTransaction: string;
}

export interface ValidateTransactionResult{
  isValid: boolean;
  error: ZodError | null;
}

export type TypeTransaction = "Pemasukan" | "Pengeluaran" | "Transfer";
