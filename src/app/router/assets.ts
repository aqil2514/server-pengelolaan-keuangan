import express from "express";
import {
  getDecryptedAssetData,
  getOrCreateUserData,
} from "../utils/asset-utils";

const assetsRouter = express.Router();

assetsRouter.get("/getAssets", async (req, res) => {
  const uid = String(req.query.uid);

  const userData = await getOrCreateUserData(uid);

  const assetData = getDecryptedAssetData(String(userData?.user_assets), uid);

  return res.status(200).json({ assetData });
});

export default assetsRouter;
