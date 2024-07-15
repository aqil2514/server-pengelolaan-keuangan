import { AccountDB, AccountData, AccountUser } from "../../@types/Account";
import { TransactionBodyType, TransactionType } from "../../@types/Transaction";
import { AssetsData } from "../../@types/Assets";
import supabase from "../lib/db";
import { encryptAssets, getDecryptedAssetData } from "./asset-utils";
import { getDecryptedTransactionData } from "./transaction-utils";



/**
 * Menghasilkan hex color number secara random
 * @returns {string} Hex Color Number
 */
export function getRandomHexColor(): string {
  const hexCharacters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * hexCharacters.length);
    color += hexCharacters[randomIndex];
  }
  return color;
}

/**
 * Mendapatkan semua nama aset tanpa duplikat
 * @param transactions Data Transaksi
 * @param assets Data Asset
 * @returns Set object yang berisi nama-nama set
 */
export function getUniqueAssetNames(transactions: TransactionType[], assets: AssetsData[]): Set<string> {
  const assetNames = new Set<string>();

  transactions.forEach((transaction) => {
    transaction.body.forEach((transactionItem) => {
      assetNames.add(transactionItem.asset.trim());
    });
  });

  assets.forEach((asset) => {
    assetNames.add(asset.name.trim());
  });

  return assetNames;
}

export async function getUser(id: string) {
  const res = await supabase.from("user").select("*").eq("uid", id);

  const proc: AccountDB = res.data![0];

  const user: AccountUser = {
    uid: proc.uid,
    username: proc.username,
    privacy: proc.privacy,
    email: proc.email,
    config: proc.config,
    statusFlags: proc.statusFlags,
  };

  return user;
}

export async function getUserWithPassword(id: string) {
  const res = await supabase.from("user").select("*").eq("uid", id);

  const user: AccountDB = res.data![0];

  return user;
}

export async function getUserData(id: string) {
  const res = await supabase.from("user_data").select("*").eq("userId", id);

  const proc: AccountData = res.data![0];

  return proc;
}

// TODO : Bikin penanganan gimana kalo asset dari user itu masih kosong
export async function synchronizeUserData(data: AccountData, uid: string) {
  let decryptTransaction: TransactionType[] = [];
  const decryptAsset = getDecryptedAssetData(
    String(data.user_assets),
    data.userId
  );
  const dataTrasaction = getDecryptedTransactionData(
    String(data.user_transaction),
    data.userId
  );

  if (Array.isArray(dataTrasaction)) decryptTransaction = dataTrasaction;
  else {
    decryptTransaction.push(dataTrasaction);
  }

  const assetNames = new Set<string>();

  // Mengumpulkan nama aset dari data transaksi tanpa duplikat
  decryptTransaction.forEach((transaction) => {
    transaction.body.forEach((transactionItem) => {
      assetNames.add(transactionItem.asset.trim());
    });
  });

  // Mengumpulkan nama aset dari data aset tanpa duplikat
  decryptAsset.forEach((asset) => {
    assetNames.add(asset.name.trim());
  });

  // Membuat array dari setiap nama aset yang unik
  const uniqueAssetNames = Array.from(assetNames);

  const updatedAsset: AssetsData[] = [];

  uniqueAssetNames.forEach((assetName) => {
    // Mencari transaksi yang berkaitan dengan aset
    const relatedTransactions = decryptTransaction.filter((transaction) =>
      transaction.body.some(
        (transactionItem) => transactionItem.asset.trim() === assetName
      )
    );

    // Menghitung jumlah total aset dan mencari deskripsi aset
    const amountSum = relatedTransactions
      .flatMap((transaction) =>
        transaction.body.filter(
          (transactionItem) => transactionItem.asset.trim() === assetName
        )
      )
      .reduce((acc, curr) => acc + curr.price, 0);

    const descriptionAsset = decryptAsset.find(
      (asset) => asset.name.trim() === assetName
    )?.description;
    const groupAsset = decryptAsset.find(
      (asset) => asset.name.trim() === assetName
    )?.group;
    const assetColor = decryptAsset.find(
      (asset) => asset.name.trim() === assetName
    )?.color;

    const assetItem: AssetsData = {
      name: assetName,
      amount: amountSum,
      description: descriptionAsset
        ? descriptionAsset
        : "Aset belum diberi deskripsi",
      group: groupAsset ? groupAsset : "Aset belum diberi kategori",
      color: assetColor ? assetColor : getRandomHexColor()
    };

    updatedAsset.push(assetItem);
  });

  const encryptData = encryptAssets(updatedAsset, uid).toString();

  return await supabase
    .from("user_data")
    .update({ user_assets: encryptData })
    .eq("userId", uid);
}

/**
 * Mengkapitalisasi huruf pertama dari setiap kata dalam string.
 * @param str - String yang akan dikapitalisasi
 * @returns String dengan setiap kata yang dikapitalisasi
 */
export const toCapitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};
