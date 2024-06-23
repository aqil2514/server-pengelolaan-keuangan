import { AccountDB, AccountData, AccountUser } from "../../@types/Account";
import { TransactionBodyType, TransactionType } from "../../@types/Transaction";
import { AssetsData } from "../../@types/Assets";
import supabase from "../lib/db";
import { encryptAssets, getDecryptedAssetData } from "./asset-utils";
import { getDecryptedTransactionData } from "./transaction-utils";

export async function getUser(id: string) {
  const res = await supabase.from("user").select("*").eq("uid", id);
  if (!res.data || res.data?.length === 0) return null;

  const proc: AccountDB = res.data[0];

  const user: AccountUser = {
    uid: proc.uid,
    username: proc.username,
    privacy: proc.privacy,
    email: proc.email,
    config: proc.config,
  };

  return user;
}

export async function getUserWithPassword(id: string) {
  const res = await supabase.from("user").select("*").eq("uid", id);
  if (!res.data || res.data?.length === 0) return null;

  const user: AccountDB = res.data[0];

  return user
}

export async function getUserData(id: string) {
  const res = await supabase.from("user_data").select("*").eq("userId", id);
  if (!res.data || res.data?.length === 0) return null;

  const proc: AccountData = res.data[0];

  return proc;
}

// TODO : Bikin penanganan gimana kalo asset dari user itu masih kosong
export async function synchronizeUserData(data: AccountData, uid:string) {
  let decryptTransaction:TransactionType[] = []
  const decryptAsset = getDecryptedAssetData(String(data.user_assets), data.userId);
  const dataTrasaction = getDecryptedTransactionData(String(data.user_transaction), data.userId);
  
  if(Array.isArray(dataTrasaction)) decryptTransaction = dataTrasaction;
  else{
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
      transaction.body.some((transactionItem) => transactionItem.asset.trim() === assetName)
    );

    // Menghitung jumlah total aset dan mencari deskripsi aset
    const amountSum = relatedTransactions.flatMap((transaction) =>
      transaction.body.filter((transactionItem) => transactionItem.asset.trim() === assetName)
    ).reduce((acc, curr) => acc + curr.price, 0);

    const descriptionAsset = decryptAsset.find((asset) => asset.name.trim() === assetName)?.description;
    const groupAsset = decryptAsset.find((asset) => asset.name.trim() === assetName)?.group;

    const assetItem: AssetsData = {
      name: assetName,
      amount: amountSum,
      description: descriptionAsset ? descriptionAsset : "Aset belum diberi deskripsi",
      group: groupAsset ? groupAsset : "Aset belum diberi kategori",
    };

    updatedAsset.push(assetItem);
  });

  const encryptData = encryptAssets(updatedAsset, uid).toString();
  
  return await supabase.from("user_data").update({user_assets:encryptData}).eq("userId", uid);
}

/**
 * Mengkapitalisasi huruf pertama dari setiap kata dalam string.
 * @param str - String yang akan dikapitalisasi
 * @returns String dengan setiap kata yang dikapitalisasi
 */
export const toCapitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};