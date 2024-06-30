import {
  AssetDeleteOption,
  AssetTransferData,
  AssetsData,
} from "../../@types/Assets";
import supabase from "../lib/db";
import CryptoJS from "crypto-js";
import {
  getUserData,
  synchronizeUserData,
  toCapitalizeWords,
} from "./general-utils";
import { AccountData } from "../../@types/Account";
import {
  getDecryptedTransactionData,
  saveTransaction,
} from "./transaction-utils";
import { TransactionBodyType } from "../../@types/Transaction";

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

  // Mendekripsi data aset pengguna
  const decryptAsset = getDecryptedAssetData(
    String(userData?.user_assets),
    uid
  );

  // Jika data pengguna tidak ada atau data aset kosong, buat koleksi aset awal
  if (!userData || !userData.user_assets || decryptAsset.length === 0) {
    const assetCollections = [
      {
        name: "Dompet Kebutuhan",
        amount: 0,
        description: "Uang khusus untuk kebutuhan",
        group: "Tunai",
      },
      {
        name: "Dompet Keinginan",
        amount: 0,
        description: "Uang khusus untuk keinginan",
        group: "Tunai",
      },
      {
        name: "Dompet Transportasi",
        amount: 0,
        description: "Uang khusus untuk transportasi",
        group: "Tunai",
      },
    ];
    // Mengenkripsi koleksi aset awal
    const encryptAssets = CryptoJS.AES.encrypt(
      JSON.stringify(assetCollections),
      uid
    ).toString();

    // Menambahkan data pengguna baru jika pengguna tidak ada dalam database
    if (!userData) {
      await supabase
        .from("user_data")
        .insert({ userId: uid, user_assets: encryptAssets });
    }
    // Memperbarui data pengguna jika pengguna ada tapi tidak memiliki data aset atau data aset terdekripsi kosong
    else if (!userData.user_assets || decryptAsset.length === 0) {
      await supabase
        .from("user_data")
        .update({ user_assets: encryptAssets })
        .eq("userId", uid);
    }
  }
  // Menyinkronkan data pengguna yang ada
  else {
    await synchronizeUserData(userData, uid);
  }

  // Mengambil data pengguna yang diperbarui atau baru dibuat dari database
  const data = await supabase
    .from("user_data")
    .select("*")
    .eq("userId", uid)
    .then((data) => data.data![0]);

  return data;
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
