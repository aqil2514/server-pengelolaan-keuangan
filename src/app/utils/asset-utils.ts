import { AssetsData } from "../../@types/assets";
import supabase from "../lib/db";
import CryptoJS from "crypto-js";
import { getUserData, synchronizeUserData } from "./general-utils";
import { AccountData } from "../../@types/Account";

export const getOrCreateUserData = async (
  uid: string
): Promise<AccountData> => {
  const userData = await getUserData(uid);

  if (!userData || !userData.user_assets) {
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
    } else if (!userData.user_assets) {
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

export const encryptAssets = (data: AssetsData[], uid: string) => {
  const stringData = JSON.stringify(data);
  const encryptData = CryptoJS.AES.encrypt(stringData, uid);

  return encryptData;
};

export const getDecryptedAssetData = (
  encryptedData: string,
  uid: string
): AssetsData[] => {
  return JSON.parse(
    CryptoJS.AES.decrypt(String(encryptedData), uid).toString(CryptoJS.enc.Utf8)
  );
};
