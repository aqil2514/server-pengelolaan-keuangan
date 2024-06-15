import express, { Request, Response } from "express";
import {
  assetDeleteOption,
  changeAssetTransaction,
  encryptAssets,
  getDecryptedAssetData,
  getOrCreateUserData,
  saveAssetData,
} from "../utils/asset-utils";
import { AssetFormValues, AssetsData } from "../../@types/Assets";
import { getUserData } from "../utils/general-utils";
import { getTransactionData } from "../utils/transaction-utils";
import { TransactionType } from "../../@types/Transaction";

const assetsRouter = express.Router();

assetsRouter.get("/getAssets", async (req: Request, res: Response) => {
  const uid = String(req.query.uid);

  const userData = await getOrCreateUserData(uid);

  const assetData = getDecryptedAssetData(String(userData?.user_assets), uid);

  const transactionData = getTransactionData(
    String(userData.user_transaction),
    uid
  );

  return res.status(200).json({ assetData, transactionData });
});

assetsRouter.put("/", async (req: Request, res: Response) => {
  const clientData: AssetFormValues = req.body.formData;
  const clientId: string = req.body.userId;
  const {
    assetCategory,
    assetDescription,
    assetName,
    assetNominal,
    oldAssetName,
    newAssetCategory,
  } = clientData;

  const finalData: AssetsData = {
    name: assetName,
    amount: assetNominal,
    description: decodeURIComponent(assetDescription),
    group: newAssetCategory ? newAssetCategory : assetCategory,
  };

  const userData = await getUserData(clientId);

  if (!userData) return res.status(404).json({ msg: "User tidak ditemukan" });

  const userAssetData = getDecryptedAssetData(
    String(userData.user_assets),
    clientId
  );
  const selectedIndex = userAssetData.findIndex((d) => d.name === oldAssetName);

  if (selectedIndex === -1)
    return res.status(404).json({ msg: "Data tidak ditemukan" });
  userAssetData[selectedIndex] = finalData;

  if(assetName !== oldAssetName){
    await changeAssetTransaction(oldAssetName, assetName, String(userData.user_transaction), userData.userId)
  }

  const encryptAssetData = encryptAssets(userAssetData, clientId);

  const saveData = await saveAssetData(encryptAssetData, clientId);

  if (saveData.error)
    return res
      .status(400)
      .json({ msg: "Terjadi kesalahan saat menyimpan data" });

  return res.status(200).json({ msg: "Data berhasil diubah" });
});

assetsRouter.delete("/", async (req: Request, res: Response) => {
  const {
    "asset-name": assetName,
    "user-id": clientId,
    "delete-option": deleteOption,
  } = req.query;
  const userData = await getUserData(String(clientId));

  if (!userData) return res.status(404).json({ msg: "User tidak ditemukan" });

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
  if (saveData.error)
    return res
      .status(400)
      .json({ msg: "Terjadi kesalahan saat menyimpan data" });

  return res.status(200).json({ msg: "Data yang dipilih berhasil dihapus" });
});

export default assetsRouter;
