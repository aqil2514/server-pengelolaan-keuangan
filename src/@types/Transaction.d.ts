import { ZodError, z } from "zod";
import { AccountData } from "./Account";
import { BasicResponse } from "./General";
import { TransactionFormDataSchema } from "../app/zodSchema/transaction";

export interface ErrorsTransaction {
  type: string;
  total: string;
  date: string;
}

export interface HandleTransactionProps {
  income: (
    formData: TransactionFormData,
    userData: AccountData,
    body: TransactionBodyType,
    dateTransaction: string,
    finalData: TransactionType
  ) => Promise<TransactionBasicResponse>;
  outcome: (
    formData: TransactionFormData,
    userData: AccountData,
    body: TransactionBodyType,
    dateTransaction: string,
    finalData: TransactionType
  ) => Promise<TransactionBasicResponse>;
  transfer: (
    formData: TransactionFormData,
    userData: AccountData,
    body: TransactionBodyType,
    dateTransaction: string,
    finalData: TransactionType
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

export interface TransactionFormData {
  userId: string;
  idTransaction: string;
  billTransaction: number;
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

export type TransactionFormValidation = z.infer<typeof TransactionFormDataSchema>;

export interface TransactionSaveFunctions{
  updateData: (transaction: TransactionType[], userId: string) => Promise<void>;
  newData: (dataBody: TransactionBodyType, finalData: TransactionType, userId: string) => Promise<void>;
}

export interface TransactionType {
  id?: string;
  header: string;
  body: TransactionBodyType[];
}

export type TypeTransaction = "Pemasukan" | "Pengeluaran" | "Transfer";

export interface ValidateTransactionResult {
  isValid: boolean;
  error: ZodError | null;
}

