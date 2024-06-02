import express from "express";
import supabase from "../lib/db";
import CryptoJS from "crypto-js";
import { AssetsData } from "../../@types/assets";
import { getUserData } from "../utils/general-utils";
import { AccountData } from "../../@types/Account";

const assetsRouter = express.Router();

assetsRouter.get("/getAssets", async (req, res) => {
  const uid = String(req.query.uid);

  const userData = await getUserData(uid);

  if (!userData || !userData.user_assets) {
    const assetCollections: AssetsData[] = [
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
  }

  const dataDb = await supabase.from("user_data").select("*").eq("userId", uid);
  const data: AccountData = dataDb.data![0];

  const assetData: AssetsData = JSON.parse(
    CryptoJS.AES.decrypt(String(data?.user_assets), uid).toString(
      CryptoJS.enc.Utf8
    )
  );

  return res.status(200).json({ assetData });
});

export default assetsRouter;
