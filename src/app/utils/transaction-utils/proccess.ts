import { DeleteRequest, HandleTransactionProps, TransactionBasicResponse, TransactionBodyType, TransactionFormData, TransactionType } from "src/@types/Transaction";
import { validateTransaction } from "./validation";
import { transactionAllocation } from "./misc";
import { assetTransfer, updateAssetNominal } from "../asset-utils";
import { saveTransaction } from "./manipulation";
import { ZodError } from "zod";
import { BasicResponse, ErrorValidationResponse } from "src/@types/General";
import { AccountData } from "src/@types/Account";
import { getUserData } from "../general-utils";
import { getTransactionData } from "./fetching";

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
          statusCode: 422,
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
        await updateAssetNominal(dataBody.asset, dataBody.price, userId);
        await saveTransaction.updateData(allocation, userId);
      } else {
        await updateAssetNominal(dataBody.asset, dataBody.price, userId);
        await saveTransaction.newData(dataBody, finalData, userId);
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
    async transfer(formData, userData, body, dateTransaction, finalData) {
      const { userId } = userData;
  
      const validation = validateTransaction(formData);
      if (!validation.isValid) {
        const errors = handleValidationError(validation.error);
  
        if (!errors) throw new Error("Terjadi kesalahan saat penanganan error");
  
        const result: TransactionBasicResponse = {
          message: errors[0].message,
          status: "error",
          statusCode: 422,
          data: errors,
        };
  
        return result;
      }
  
      // Data untuk transaksi pengurangan saldo dari aset awal
      const fromAssetData = assetTransfer.decreaseFromAsset(formData, body);
  
      // Data untuk transaksi penambahan saldo ke aset tujuan
      const toAssetData = assetTransfer.increaseToAsset(formData, body);
  
      // Menambahkan data transaksi ke finalData
      finalData.body.push(fromAssetData);
      finalData.body.push(toAssetData);
  
      const bodies: TransactionBodyType[] = [fromAssetData, toAssetData];
  
      const allocation = await transactionAllocation(
        userData,
        bodies,
        String(dateTransaction)
      );
      if (allocation) {
        await saveTransaction.updateData(allocation, userId);
      } else {
        await saveTransaction.newData(body, finalData, userId);
      }
  
      return { message: "OK", status: "success" };
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
        noteTransaction: "Catatan transaksi tidak valid",
        fromAsset: "Aset awal belum diisi",
        toAsset: "Aset tujuan belum diisi",
        sameAsset: "Aset awal dan aset tujuan tidak boleh sama",
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
    else if (typeTransaction === "Pengeluaran")
      return await handleTransaction.outcome(
        formData,
        userData,
        dataBody,
        dateTransaction,
        finalData
      );
  
    return handleTransaction.transfer(
      formData,
      userData,
      dataBody,
      dateTransaction,
      finalData
    );
  }
  
  // TODO: Next rapihin ini. Jadi nanti pakek throw new Error ajah.
  export async function processDeleteData(
    uid: string,
    body: DeleteRequest
  ): Promise<BasicResponse> {
    const userData = await getUserData(uid);
  
    if (!userData) {
      const response: BasicResponse = {
        message: "Data user tidak ada",
        status: "error",
        statusCode: 404,
      };
      return response;
    }
  
    const transactions = getTransactionData(
      String(userData.user_transaction),
      String(userData.userId)
    );
    const selectedTransaction = transactions.find((d) => d.id === body.id);
  
    if (!selectedTransaction)
      throw new Error("Terjadi kesalahan saat pemilihan data transaksi");
  
    const transactionAssetName = selectedTransaction.body.find(
      (d) => d.uid === body.uid
    )?.asset;
    const transactionAssetNominal = selectedTransaction.body.find(
      (d) => d.uid === body.uid
    )?.price;
  
    if (!transactionAssetName)
      throw new Error("Nama Aset transaksi tidak ditemukan");
    if (!transactionAssetNominal) throw new Error("Nominal aset tidak ditemukan");
  
    if (!transactions) {
      const response: BasicResponse = {
        message: "Data transaksi tidak ditemukan",
        status: "error",
        statusCode: 404,
      };
      return response;
    }
  
    const filteredTransaction = transactions
      .find((d) => d.id === body.id)
      ?.body.filter((d) => d.uid !== body.uid);
  
    if (filteredTransaction) {
      transactions.find((d) => d.id === body.id)!.body = filteredTransaction;
    }
  
    const newTransaction = transactions.filter((d) => d.body.length !== 0);
  
    await updateAssetNominal(
      transactionAssetName,
      transactionAssetNominal * -1,
      uid
    );
    await saveTransaction.updateData(newTransaction, uid);
  
    const response: BasicResponse = {
      message: "Data berhasil dihapus",
      status: "success",
    };
  
    return response;
  }