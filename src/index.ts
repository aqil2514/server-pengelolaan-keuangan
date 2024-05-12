import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import supabase from "./lib/db";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get("/", async (req: Request, res: Response) => {

  
let transaction = await supabase
.from('transaction')
.select('*')
  
  res.json(transaction);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});