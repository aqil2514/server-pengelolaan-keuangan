import { AssetsData } from "../../@types/Assets";
import supabase from "../lib/db";
import CryptoJS from "crypto-js";
import { getUserData, synchronizeUserData } from "./general-utils";
import { AccountData } from "../../@types/Account";

export const encryptAssets = (data: AssetsData[], uid: string) => {
  const stringData = JSON.stringify(data);
  const encryptData = CryptoJS.AES.encrypt(stringData, uid).toString();

  return encryptData;
};

export const getDecryptedAssetData = (
  encryptedData: string,
  uid: string
): AssetsData[] => {
  let assetData: AssetsData[] = [];

  if (encryptedData) {
    const data: AssetsData[] = JSON.parse(
      CryptoJS.AES.decrypt(String(encryptedData), uid).toString(
        CryptoJS.enc.Utf8
      )
    );

    return (assetData = data);
  }

  return assetData;
};

export const getOrCreateUserData = async (
  uid: string
): Promise<AccountData> => {
  const userData = await getUserData(uid);

  const decryptAsset = getDecryptedAssetData(
    String(userData?.user_assets),
    uid
  );

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
        description: "Uang khusus untuk Keinginan",
        group: "Tunai",
      },
      {
        name: "Dompet Transportasi",
        amount: 0,
        description: "Uang khusus untuk transportasi",
        group: "Tunai",
      },
    ];
    const encryptAssets = CryptoJS.AES.encrypt(
      JSON.stringify(assetCollections),
      uid
    ).toString();

    if (!userData) {
      await supabase
        .from("user_data")
        .insert({ userId: uid, user_assets: encryptAssets });
    } else if (!userData.user_assets || decryptAsset.length === 0) {
      await supabase
        .from("user_data")
        .update({ user_assets: encryptAssets })
        .eq("userId", uid);
    }
  } else {
    await synchronizeUserData(userData, uid);
  }

  const data = await supabase
    .from("user_data")
    .select("*")
    .eq("userId", uid)
    .then((data) => data.data![0]);
  return data;
};

export const saveAssetData = async (finalData: string, userId: string) => {
  const result = await supabase
    .from("user_data")
    .update({ user_assets: finalData })
    .eq("userId", userId)
    .select();
  return result;
};
