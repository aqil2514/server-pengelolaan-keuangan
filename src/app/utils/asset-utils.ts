import supabase from "../lib/db";
import CryptoJS from "crypto-js";
import {
  getUserData,
  // synchronizeUserData,
  toCapitalizeWords,
} from "./general-utils";
import {
  getDecryptedTransactionData,
  getSelectedTransactionBodyData,
} from "./transaction-utils/fetching";
import { AccountData } from "src/@types/Account";
import {
  AssetDeleteOption,
  AssetsData,
  AssetTransferData,
} from "src/@types/Assets";
import {
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
} from "src/@types/Transaction";
import { saveTransaction } from "./transaction-utils/manipulation";

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

  // * Function di bwaah ternyata perlu. Nanti difix */
  // await synchronizeUserData(userData, uid);

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

/**
 * Memperbarui nominal asset saat ini. Biasa digunakan jika ada operasi matematika di Transaksi
 * @param assetName Nama aset yang akan dihapus
 * @param nominal Nominalnya. Jika ingin dikurang, cukup tambahkan *-1.
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
    const encryptedData = encryptAssets(decryptData, userId);
    await saveAssetData(encryptedData, userId);
  } catch (error) {
    console.error("Terjadi error saat update nominal Asset:", error);
    throw error;
  }
};

export const editAssetNominal = async (
  transaction: TransactionType[],
  form: TransactionFormData,
  userId: string
): Promise<TransactionType[]> => {
  // * Persiapan Awal *
  const { idTransaction, uidTransaction, assetsTransaction, categoryTransaction, noteTransaction, typeTransaction,totalTransaction } = form; // ! Ambil beberapa data yang diperlukan
  const selectedData = getSelectedTransactionBodyData(
    transaction,
    String(idTransaction),
    String(uidTransaction)
  ); // ! Seleksi data yang akan dipilih
  const oldData = selectedData; // ! Data lama
  const newData:TransactionBodyType = {
    asset:assetsTransaction,
    category: categoryTransaction,
    item: noteTransaction,
    price: typeTransaction === "Pemasukan" ? totalTransaction : totalTransaction * -1,
  }; // ! Data baru

  const userData = await getUserData(userId); // ! Dapatkan user data. Ini masih dalam bentuk enkripsi
  const assetData = getDecryptedAssetData(userData.user_assets, userId); // ! Data user didekripsi

  // * Persiapan Awal Selesai *

 // ? Bagaimana jika nominalnya berubah?
if (oldData.price !== newData.price) {
  const assetIndex = assetData.findIndex((asset) => asset.name === oldData.asset);

  if (assetIndex < 0) throw new Error("Data aset yang dipilih tidak ada");

  // Mengurangi harga lama dan menambahkan harga baru
  const oldPrice = oldData.price || 0; // Default ke 0 jika undefined
  const newPrice = newData.price || 0; // Default ke 0 jika undefined

  assetData[assetIndex].amount = Math.max(
    0,
    assetData[assetIndex].amount - oldPrice + newPrice
  );

  await saveAssetData(JSON.stringify(assetData), userId);
}
  
  // ? Bagaimana jika nama asetnya berubah?
  if(oldData.asset !== newData.asset){
    console.log("Perubahan nama aset terdeteksi")
  }

  return transaction;
};
