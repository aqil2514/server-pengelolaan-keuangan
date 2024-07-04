import express, { Request, Response } from "express";
import {
  assetDeleteOption,
  changeAssetTransaction,
  encryptAssets,
  getDecryptedAssetData,
  getOrCreateUserData,
  processAsset,
  saveAssetData,
} from "../utils/asset-utils";
import { AssetFormValues, AssetsData, DeleteOption } from "../../@types/Assets";
import { getUserData } from "../utils/general-utils";
import { getTransactionData } from "../utils/transaction-utils";
import { TransactionType } from "../../@types/Transaction";
import { STATUS_UNPROCESSABLE_ENTITY } from "../lib/httpStatusCodes";
import { BasicResponse } from "../../@types/General";

const assetsRouter = express.Router();

assetsRouter.get("/getAssets", async (req: Request, res: Response) => {
  const uid = String(req.query.uid);

  const userData = await getOrCreateUserData(uid);
  // const userData = await getUserData(uid);

  if(!userData) throw new Error("User data tidak ada")

  const assetData = getDecryptedAssetData(String(userData?.user_assets), uid);

  const transactionData = getTransactionData(
    String(userData.user_transaction),
    uid
  );

  return res.status(200).json({ assetData, transactionData });
});

assetsRouter.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  const formData: AssetFormValues = body.formData;
  const userId: string = body.userId;

  const finalData = await processAsset.createNew(formData, userId);
  const statusRes = finalData.status === "error" ? 400 : 200;

  return res.status(finalData.statusCode || statusRes).json(finalData);
});

assetsRouter.put("/", async (req: Request, res: Response) => {
  const clientData: AssetFormValues = req.body.formData;
  const clientId: string = req.body.userId;

  const finalData = await processAsset.updateData(clientData, clientId);
  const statusRes = finalData.status === "error" ? 400 : 200;

  return res.status(finalData.statusCode || statusRes).json(finalData);
});

assetsRouter.delete("/", async (req: Request, res: Response) => {
  const {
    "asset-name": assetName,
    "user-id": clientId,
    "delete-option": deleteOption,
  } = req.query;

  const result = await processAsset.deleteData(
    String(assetName),
    String(clientId),
    deleteOption as DeleteOption
  );
  const statusRes = result.status === "success" ? 200 : 400;

  return res.status(result.statusCode || statusRes).json(result);
});

export default assetsRouter;
