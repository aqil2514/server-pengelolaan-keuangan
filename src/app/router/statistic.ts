import express, { Request, Response } from "express";
import { calculatePercent, getDecryptedAssetData, getOrCreateUserData } from "../utils/asset-utils";
import { ChartData } from "src/@types/Statistic";
import { BasicResponse } from "src/@types/General";

const s_route = express.Router();

s_route.get("/", async (req: Request, res: Response) => {
  const query = req.query;
  const userId = query.userId as string;

  // Ambil data dari user
  const userData = await getOrCreateUserData(userId);

  if (!userData) throw new Error("User data tidak ada");

  // * Pilih data assetnya dan buat Chart Data
  const assetData = getDecryptedAssetData(
    String(userData?.user_assets),
    userId
  );
  const chartData: ChartData[] = [];

  for (const asset of assetData) {
    const data: ChartData = {
      name: asset.name,
      percent: calculatePercent(assetData, asset),
      color: asset.color,
    };

    chartData.push(data);
  }

  const response: BasicResponse<ChartData[]> = {
    message: "Berhasil",
    status: "success",
    data: chartData
  };

  return res.status(200).json(response);
});

export default s_route;
