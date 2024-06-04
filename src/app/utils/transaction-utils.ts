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

  const resource = String(transactionData.user_transaction);
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

export function editTransactionData(
  data: TransactionType[],
  body: TransactionFormData
) {
  const {
    idTransaction,
    uidTransaction,
    dateTransaction,
    noteTransaction,
    typeTransaction,
    totalTransaction,
    assetsTransaction,
    categoryTransaction,
  } = body;

  const selectedData = data.find((d) => d.id === idTransaction);
  const oldSelectedData = data.find((d) => d.id === idTransaction);
  if (!selectedData) throw new Error("Data yang akan diedit tidak ada");
  if (!oldSelectedData) throw new Error("Data lama tidak ada");

  const selectedBodyData = selectedData.body.find(
    (d) => d.uid === uidTransaction
  );
  if (!selectedBodyData) throw new Error("Data body tidak ada");

  if (selectedData.header === oldSelectedData.header) {
    selectedBodyData.asset = String(assetsTransaction);
    selectedBodyData.category = String(categoryTransaction);
    selectedBodyData.item = String(categoryTransaction);
    selectedBodyData.price =
      typeTransaction === "Pemasukan"
        ? Number(totalTransaction)
        : Number(totalTransaction) * -1;
    selectedBodyData.item = String(noteTransaction);

    return data;
  } else {
    const dateFind = data.find((d) => d.header === String(dateTransaction));
    // * Kasus 1 : Bagaimana jika tanggal data baru belum ada di database?
    if (!dateFind) {
      const newDataTransaction: TransactionType = {
        id: crypto.randomUUID(),
        header: String(dateTransaction),
        body: [],
      };

      const newDataTransactionBody: TransactionBodyType = {
        uid: crypto.randomUUID(),
        asset: String(assetsTransaction),
        category: String(categoryTransaction),
        item: String(noteTransaction),
        price:
          typeTransaction === "Pemasukan"
            ? Number(totalTransaction)
            : Number(totalTransaction) * -1,
      };

      const dataIndex = data.findIndex((d) => d.id === idTransaction);

      newDataTransaction.body.push(newDataTransactionBody);
      data.push(newDataTransaction);
      const filteredData = data[dataIndex].body.filter(
        (d) => d.uid !== uidTransaction
      );
      data[dataIndex].body = filteredData;

      const noNullData = data.filter((d) => d.body.length !== 0);

      return noNullData;
    }

    // * Kasus 2 : Bagaimana jika tanggal data baru sudah ada di database?
    const newDataBody = selectedData.body.filter(
      (d) => d.uid !== selectedBodyData.uid
    );
    dateFind.body.push(selectedBodyData);
    selectedData.body = newDataBody;

    const noNullData = data.filter((d) => d.body.length !== 0);

    return noNullData;
  }
}

export const getDecryptedTransactionData = (
  encryptedData: string,
  uid: string
): TransactionType[] => {
  let transactionData:TransactionType[] = [];

  if(encryptedData){
    const data = JSON.parse(
      CryptoJS.AES.decrypt(String(encryptedData), uid).toString(CryptoJS.enc.Utf8)
    );

    transactionData = data;
  }

  return transactionData;
};


export function getTransactionData(transactionData: string, key: string) {
  const decryptData = CryptoJS.AES.decrypt(transactionData, key).toString(
    CryptoJS.enc.Utf8
  );
  const result: TransactionType[] = JSON.parse(decryptData);

  return result;
}

export function encryptTransactionData(transactionData: string, key: string) {
  const encryptData = CryptoJS.AES.encrypt(transactionData, key).toString();

  return encryptData;
}

const TransactionFormDataSchema = z.object({
  typeTransaction: z.enum(["Pemasukan", "Pengeluaran"], {
    message: "Tipe transaksi tidak diizinkan",
  }),
  totalTransaction: z.number({ message: "Total transaksi harus berupa angka" }),
  dateTransaction: z
    .date({
      message: "Transaksi harus berupa tanggal",
      invalid_type_error: "Tanggal harus diisi",
    })
    .max(new Date(), "Transaksi tidak boleh dari masa depan"),
  categoryTransaction: z.string().min(1, "Category transaksi belum diisi"),
  assetsTransaction: z.string().min(1, "Aset transaksi belum diisi"),
  noteTransaction: z.string().min(1, "Catatan transaksi belum diisi"),
});

export function validateTransaction(formData: TransactionFormData) {
  formData.dateTransaction = new Date(String(formData.dateTransaction));

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
