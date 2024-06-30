import { ZodError, ZodIssue, isValid, z } from "zod";
import {
  HandleTransactionProps,
  TransactionBasicResponse,
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
  ValidateTransactionResult,
} from "../../@types/Transaction";
import { Account, AccountData } from "../../@types/Account";
import CryptoJS from "crypto-js";
import supabase from "../lib/db";
import { TransactionFormDataSchema } from "../zodSchema/transaction";
import { ErrorValidationResponse } from "../../@types/General";
import { STATUS_UNPROCESSABLE_ENTITY } from "../lib/httpStatusCodes";

function addNewTransaction(
  dateTransaction: string,
  transactions: TransactionType[],
  body: TransactionBodyType
) {
  const newDate: TransactionType = {
    id: crypto.randomUUID(),
    header: dateTransaction,
    body: [],
  };

  newDate.body.push(body);
  transactions.push(newDate);

  return transactions;
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

export const getDecryptedTransactionData = (
  encryptedData: string,
  uid: string
): TransactionType[] => {
  let transactionData: TransactionType[] = [];

  if (encryptedData) {
    const data = JSON.parse(
      CryptoJS.AES.decrypt(String(encryptedData), uid).toString(
        CryptoJS.enc.Utf8
      )
    );

    transactionData = data;
  }

  return transactionData;
};

/**
 * Fungsi untuk mendekripsi dan mengurai data transaksi.
 *
 * @param transactionData - Data transaksi terenkripsi dalam bentuk string
 * @param key - Kunci yang digunakan untuk dekripsi
 * @returns Array dari objek TransactionType
 */
export function getTransactionData(
  transactionData: string,
  key: string
): TransactionType[] {
  let result: TransactionType[] = [];

  // Mendekripsi data transaksi menggunakan dekripsi AES
  const decryptData = CryptoJS.AES.decrypt(transactionData, key).toString(
    CryptoJS.enc.Utf8
  );

  // Mengurai data yang telah didekripsi
  const parsedData = JSON.parse(decryptData);

  // Memeriksa apakah data yang diurai adalah array
  if (Array.isArray(parsedData)) {
    // Jika berupa array, set hasilnya ke array yang diurai
    result = parsedData;
  } else {
    // Jika bukan berupa array, masukkan objek yang diurai ke dalam array hasil
    result.push(parsedData);
  }

  // Mengembalikan array hasil
  return result;
}

export const handleTransaction: HandleTransactionProps = {
  async income(formData, userData, dataBody, dateTransaction, finalData) {
    const { userId } = userData;
    
    const validation = validateTransaction(formData);
    if (!validation.isValid) {
      const errors = handleValidationError(validation.error);

      if (!errors) throw new Error("Terjadi kesalahan saat penanganan error");

      const result: TransactionBasicResponse = {
        message: errors[0].message,
        status: "error",
        statusCode: STATUS_UNPROCESSABLE_ENTITY,
        data: errors,
      };

      return result;
    }

    const allocation = await transactionAllocation(
      userData,
      dataBody,
      String(dateTransaction)
    );
    if (allocation) {
      await saveTransactionData(allocation, userId);
    } else {
      await saveNewTransaction(dataBody, finalData, userId);
    }

    const result: TransactionBasicResponse = {
      message: "ok",
      status: "success",
    };

    return result;
  },
  async outcome(formData, userData, body, dateTransaction, finalData) {
    return await this.income(
      formData,
      userData,
      body,
      dateTransaction,
      finalData
    );
  },
};

export function handleValidationError(
  data: ZodError | null
): ErrorValidationResponse[] | undefined {
  if (!data) return;
  const result = data.issues.map((e) => {
    const path = String(e.path[0]);

    const notifMessage: Record<string, string> = {
      typeTransaction: "Tipe transaksi tidak valid",
      totalTransaction: "Nominal transaksi tidak valid",
      dateTransaction: "Tanggal transaksi tidak valid",
      categoryTransaction: "Kategori transaksi tidak valid",
      assetsTransaction: "Asset transaksi tidak valid",
      noteTransaction: "Item transaksi tidak valid",
    };

    const error: ErrorValidationResponse = {
      message: e.message,
      path: e.path[0] as string,
      notifMessage: notifMessage[path],
    };

    return error;
  });

  return result;
}

export async function processData(
  typeTransaction: TransactionFormData["typeTransaction"],
  formData: TransactionFormData,
  userData: AccountData,
  dataBody: TransactionBodyType,
  dateTransaction: string,
  finalData: TransactionType
) {
  if (typeTransaction === "Pemasukan")
    return await handleTransaction.income(
      formData,
      userData,
      dataBody,
      dateTransaction,
      finalData
    );

  return await handleTransaction.outcome(
    formData,
    userData,
    dataBody,
    dateTransaction,
    finalData
  );
}

export async function saveTransactionData(
  transaction: TransactionType[],
  userId: string
) {
  const data = encryptTransactionData(JSON.stringify(transaction), userId);

  const result = await supabase
    .from("user_data")
    .update({ user_transaction: data })
    .eq("userId", userId)
    .select();
  return result;
}

export async function saveNewTransaction(
  dataBody: TransactionBodyType,
  finalData: TransactionType,
  userId: string
) {
  finalData.body.push(dataBody);

  const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(finalData),
    String(userId)
  ).toString();

  const userTransactionData: AccountData = {
    userId: String(userId),
    user_transaction: encryptedData,
  };

  await supabase
    .from("user_data")
    .update({ user_transaction: userTransactionData.user_transaction })
    .eq("userId", userTransactionData.userId);
}

export const setToMidnight = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export async function transactionAllocation(
  transactionData: AccountData | null,
  body: TransactionBodyType,
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

  selectedTransaction.body.push(body);

  return transactions;
}

export function validateTransaction(
  formData: TransactionFormData
): ValidateTransactionResult {
  formData.dateTransaction = new Date(String(formData.dateTransaction));

  try {
    TransactionFormDataSchema.parse(formData);
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { isValid: false, error };
    }
  }
  return { isValid: false, error: null };
}
