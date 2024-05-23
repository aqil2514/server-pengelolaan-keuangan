import express, { Request, Response } from "express";
const accountRoute = express.Router();

accountRoute.post("/register", async (req: Request, res: Response) => {
  const data = req.body;

  console.log(data);

  return res.status(200).json({ msg: "ok" });
});

export default accountRoute;