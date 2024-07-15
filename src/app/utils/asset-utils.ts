import supabase from "../lib/db";
import CryptoJS from "crypto-js";
import {
  getUserData,
  synchronizeUserData,
  toCapitalizeWords,
} from "./general-utils";
import {
  getDecryptedTransactionData,
  processData,
  saveTransaction,
} from "./transaction-utils";
import {
  STATUS_BAD_REQUEST,
  STATUS_CONFLICT,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNPROCESSABLE_ENTITY,
} from "@/lib/httpStatusCodes";
import { AccountData } from "@customTypes/Account";
import {
  AssetDeleteOption,
  AssetProcessProps,
  AssetsData,
  AssetTransferData,
} from "@customTypes/Assets";
import {
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
} from "@customTypes/Transaction";
import { BasicResponse } from "@customTypes/General";

/**
 * Mengenkripsi data aset yang diberikan menggunakan identifier unik pengguna (uid)
 * @param {AssetsData[]} data - Data aset yang akan dienkripsi
 * @param {string} uid - Identifier unik dari pengguna
 * @returns {string} - Data aset yang telah dienkripsi
 */
export const encryptAssets = (data: AssetsData[], uid: string) => {
  // Mengubah data aset menjadi string JSON
  const stringData = JSON.stringify(data);
  // Mengenkripsi string JSON menggunakan enkripsi AES dengan uid sebagai kunci
  const encryptData = CryptoJS.AES.encrypt(stringData, uid).toString();

  return encryptData;
};

export const assetTransfer: AssetTransferData = {
  decreaseFromAsset(formData, body) {
    const fromAssetData: TransactionBodyType = {
      ...body,
      asset: formData.fromAsset,
      category: "Pindah Aset",
      price: -Math.abs(body.price),
    };

    return fromAssetData;
  },
  increaseToAsset(formData, body) {
    const toAssetData: TransactionBodyType = {
      ...body,
      asset: formData.toAsset,
      category: "Pindah Aset",
      price: Math.abs(body.price),
    };

    return toAssetData;
  },
};

export const assetDeleteOption: AssetDeleteOption = {
  deleteTransaction: async (
    clientData: string,
    encTransaction: string,
    oldAsset: string
  ) => {
    // Ambil data semua transaksi
    const transactions = getDecryptedTransactionData(
      encTransaction,
      clientData
    );

    const updatedAsset = transactions
      .map((transaction) => ({
        ...transaction,
        body: transaction.body.filter(
          (bodyItem) => bodyItem.asset.trim() !== oldAsset.trim()
        ),
      }))
      .filter((d) => d.body.length > 0);

    await saveTransaction.updateData(updatedAsset, clientData);

    return updatedAsset;
  },
  moveTransaction: async (
    deleteOption: string,
    clientData: string,
    encTransaction: string,
    oldAsset: string
  ) => {
    // Dapatkan nama dari target aset pemindahan
    const targetAsset = deleteOption.split("to-")[1].replaceAll("-", " ");

    // Ambil data semua transaksi
    const transactions = getDecryptedTransactionData(
      encTransaction,
      clientData
    );

    // <<<<< Memindahkan asset lama ke asset baru >>>>>
    // Petakan semua asset
    const updatedTransaction = transactions.map((transaction) => {
      // Periksa! apakah ada body yang masih menggunakan aset lama?
      if (transaction.body.some((body) => body.asset.trim() === oldAsset)) {
        // Jika body masih ada yang menggunakan aset lama, petakan lagi bodynya.
        const updatedBody = transaction.body.map((bodyItem) =>
          // Apakah asset bodynya sama dengan asset lama?
          bodyItem.asset.trim() === oldAsset
            ? // Jika sama dengan asset lama, ganti asset tersebut menjadi asset baru
              { ...bodyItem, asset: toCapitalizeWords(targetAsset) }
            : // Jika bukan, jangan disentuh.
              bodyItem
        );

        // Kembalikan transaksinya
        return { ...transaction, body: updatedBody };
      }

      return transaction;
    });

    await saveTransaction.updateData(updatedTransaction, clientData);

    return updatedTransaction;
  },
};

export function calculatePercent(
  allData: AssetsData[],
  currentData: AssetsData
): number {
  // *Jumlahkan semua nominal pada data
  const allNominal = allData.reduce((acc, curr) => {
    const result = acc + curr.amount;
    return result;
  }, 0);

  // *Jika semua nominalnya adalah 0, kembalikan 0 untuk menghindari pembagian dengan 0
  if (allNominal === 0) return 0;

  // *Ambil nominal dari currentData dan hitung persentasenya
  const selectedNominal = currentData.amount;
  const percent = (selectedNominal / allNominal) * 100;

  return parseFloat(percent.toFixed(2));
}

export const changeAssetTransaction = async (
  oldAssetName: string,
  newAssetName: string,
  encTransaction: string,
  clientId: string
) => {
  const transactions = getDecryptedTransactionData(encTransaction, clientId);
  const updatedTransaction = transactions.map((transaction) => {
    if (transaction.body.some((body) => body.asset.trim() === oldAssetName)) {
      // Jika body masih ada yang menggunakan aset lama, petakan lagi bodynya.
      const updatedBody = transaction.body.map((bodyItem) =>
        // Apakah asset bodynya sama dengan asset lama?
        bodyItem.asset.trim() === oldAssetName
          ? // Jika sama dengan asset lama, ganti asset tersebut menjadi asset baru
            { ...bodyItem, asset: newAssetName }
          : // Jika bukan, jangan disentuh.
            bodyItem
      );

      // Kembalikan transaksinya
      return { ...transaction, body: updatedBody };
    }

    return transaction;
  });

  await saveTransaction.updateData(updatedTransaction, clientId);
};

/**
 * Mendekripsi data aset yang dienkripsi menggunakan identifier unik pengguna (uid)
 * @param {string} encryptedData - Data aset yang dienkripsi
 * @param {string} uid - Identifier unik dari pengguna
 * @returns {AssetsData[]} - Data aset yang telah didekripsi
 */
export const getDecryptedAssetData = (
  encryptedData: string,
  uid: string
): AssetsData[] => {
  let assetData: AssetsData[] = [];

  if (encryptedData) {
    // Mendekripsi data terenkripsi menggunakan dekripsi AES dengan uid sebagai kunci
    const data: AssetsData[] = JSON.parse(
      CryptoJS.AES.decrypt(String(encryptedData), uid).toString(
        CryptoJS.enc.Utf8
      )
    );

    return (assetData = data);
  }

  return assetData;
};

/**
 * Mendapatkan atau membuat data pengguna berdasarkan identifier unik pengguna (uid)
 * @param {string} uid - Identifier unik dari pengguna
 * @returns {Promise<AccountData>} - Data akun pengguna
 */
export const getOrCreateUserData = async (
  uid: string
): Promise<AccountData> => {
  // Mengambil data pengguna dari database
  const userData = await getUserData(uid);

  // await synchronizeUserData(userData, uid);

  // Mengambil data pengguna yang diperbarui atau baru dibuat dari database
  const data = await supabase
    .from("user_data")
    .select("*")
    .eq("userId", uid)
    .then((data) => data.data![0]);

  return data;
};

export const processAsset: AssetProcessProps = {
  async createNew(formData, userId) {
    const {
      assetName,
      assetNominal,
      assetCategory,
      newAssetCategory,
      assetDescription,
      assetColor,
    } = formData;

    const userData = await getUserData(userId);
    const userAssetData = getDecryptedAssetData(
      String(userData?.user_assets),
      userId
    );

    let assetGroup = newAssetCategory ? newAssetCategory : assetCategory;

    if (userAssetData.find((asset) => asset.name.trim() === assetName.trim())) {
      const result: BasicResponse<AssetsData> = {
        message: "Nama Aset sudah ada",
        status: "error",
        statusCode: STATUS_UNPROCESSABLE_ENTITY,
        data: {} as AssetsData,
      };
      return result;
    }

    const formTransaction: TransactionFormData = {
      dateTransaction: new Date(),
      noteTransaction: "Modal awal",
      typeTransaction: "Pemasukan",
      totalTransaction: assetNominal,
      assetsTransaction: assetName,
      categoryTransaction: "Modal",
      userId,
    };

    // const transactionBody: TransactionBodyType = {
    //   uid: crypto.randomUUID(),
    //   asset: assetName,
    //   category: "Modal",
    //   item: "Uang awal",
    //   price:
    //     formTransaction.typeTransaction === "Pemasukan"
    //       ? Number(assetNominal)
    //       : Number(assetNominal) * -1,
    // };

    // const transactionFinalData: TransactionType = {
    //   id: crypto.randomUUID(),
    //   header: String(new Date()),
    //   body: [],
    // };

    // transactionFinalData.body.push(transactionBody);

    // await processData(
    //   formTransaction.typeTransaction,
    //   formTransaction,
    //   userData as AccountData,
    //   transactionBody,
    //   formTransaction.dateTransaction.toISOString(),
    //   transactionFinalData
    // );

    const finalData: AssetsData = {
      name: assetName,
      amount: assetNominal,
      description: decodeURIComponent(assetDescription),
      group: assetGroup,
      color: assetColor,
    };

    userAssetData.push(finalData);

    const encAssetData = encryptAssets(userAssetData, userId);

    await saveAssetData(encAssetData, userId);

    const result: BasicResponse<AssetsData> = {
      message: "Asset berhasil dibuat",
      status: "success",
      data: finalData,
      statusCode: STATUS_OK,
    };

    return result;
  },
  async updateData(formData, userId) {
    // Perbaikin di bagian sini nanti. Ada masalah.
    // Jadi, ketika nominal data lama berubah, data baru nominalnya tidak berubah.
    // Kemungkinan masalahnya ada di function synchronize
    const {
      assetCategory,
      assetDescription,
      assetName,
      assetNominal,
      oldAssetName,
      newAssetCategory,
      assetColor,
    } = formData;

    const finalData: AssetsData = {
      name: assetName,
      amount: assetNominal,
      description: decodeURIComponent(assetDescription),
      group: newAssetCategory ? newAssetCategory : assetCategory,
      color: assetColor,
    };

    const userData = await getUserData(userId);

    if (!userData) {
      const result: BasicResponse<AssetsData> = {
        message: "User tidak ditemukan",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_NOT_FOUND,
      };
      return result;
    }

    const userAssetData = getDecryptedAssetData(
      String(userData.user_assets),
      userId
    );

    if (
      assetName !== oldAssetName &&
      userAssetData.find((asset) => asset.name.trim() === assetName.trim())
    ) {
      const result: BasicResponse<AssetsData> = {
        message: "Nama Aset sudah ada",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_CONFLICT,
      };
      return result;
    }

    const selectedIndex = userAssetData.findIndex(
      (d) => d.name === oldAssetName
    );

    if (selectedIndex === -1) {
      const result: BasicResponse<AssetsData> = {
        message: "Data tidak ditemukan",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_NOT_FOUND,
      };
      return result;
    }
    userAssetData[selectedIndex] = finalData;

    if (assetName !== oldAssetName) {
      await changeAssetTransaction(
        oldAssetName,
        assetName,
        String(userData.user_transaction),
        userData.userId
      );
    }

    const encryptAssetData = encryptAssets(userAssetData, userId);

    const saveData = await saveAssetData(encryptAssetData, userId);

    if (saveData.error) {
      const result: BasicResponse<AssetsData> = {
        message: "Nama Aset sudah ada",
        status: "error",
        data: {} as AssetsData,
        statusCode: STATUS_BAD_REQUEST,
      };
      return result;
    }

    const result: BasicResponse<AssetsData> = {
      message: "Data berhasil diubah",
      status: "success",
      data: finalData,
      statusCode: STATUS_OK,
    };
    return result;
  },
  async deleteData(assetName, clientId, deleteOption) {
    const userData = await getUserData(String(clientId));

    if (!userData) {
      const result: BasicResponse<null> = {
        message: "User tidak ditemukan",
        statusCode: STATUS_NOT_FOUND,
        status: "error",
        data: null,
      };

      return result;
    }

    const userAssetData = getDecryptedAssetData(
      String(userData.user_assets),
      String(clientId)
    );

    const filteredAsset = userAssetData.filter((d) => d.name !== assetName);
    const encryptAssetData = encryptAssets(filteredAsset, String(clientId));

    if (deleteOption === "delete-transaction") {
      await assetDeleteOption.deleteTransaction(
        userData.userId,
        String(userData.user_transaction),
        String(assetName)
      );
    } else if (
      deleteOption &&
      String(deleteOption).includes("move-transaction")
    ) {
      await assetDeleteOption.moveTransaction(
        String(deleteOption),
        userData.userId,
        String(userData.user_transaction),
        String(assetName)
      );
    }

    const saveData = await saveAssetData(encryptAssetData, String(clientId));
    if (saveData.error) {
      const result: BasicResponse<null> = {
        message: "Terjadi kesalahan saat menyimpan data",
        status: "error",
        data: null,
        statusCode: STATUS_BAD_REQUEST,
      };
      return result;
    }

    const result: BasicResponse<null> = {
      message: "Aset berhasil dihapus",
      status: "success",
      data: null,
      statusCode: STATUS_OK,
    };

    return result;
  },
};

/**
 * Asset Utils | Simpan Asset Data
 * @param finalData Data yang sudah dienrkipsi
 * @param userId Id usernya
 * @returns
 */
export const saveAssetData = async (finalData: string, userId: string) => {
  const result = await supabase
    .from("user_data")
    .update({ user_assets: finalData })
    .eq("userId", userId)
    .select();
  return result;
};

/**
 * Memperbarui nominal asset saat ini. Biasa digunakan jika ada operasi matematika di Transaksi
 * @param assetName Nama aset
 * @param nominal Nominal
 * @param userId User ID
 */
export const updateAssetNominal = async (
  assetName: string,
  nominal: number,
  userId: string
) => {
  try {
    // Cari data punya user dengan userId
    const userData = await getUserData(userId);

    // Dekripsi datanya
    const decryptData = getDecryptedAssetData(userData.user_assets, userId);

    // Pilih data yang assetnamenya sesuai
    const dataIndex = decryptData.findIndex((data) => data.name === assetName);
    if (dataIndex === -1) throw new Error("Data asset tidak ditemukan");

    // Lakukan operasi matematika
    decryptData[dataIndex].amount += nominal;

    // Enkripsi dan Save data
    await saveAssetData(JSON.stringify(decryptData), userId);
  } catch (error) {
    console.error("Terjadi error saat update nominal Asset:", error);
    throw error;
  }
};
