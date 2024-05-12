import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import supabase from "./lib/db";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get("/transaction", async (req: Request, res: Response) => {

  
let data = await supabase
.from('transaction')
.select('*')
  
  res.json(data.data);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});