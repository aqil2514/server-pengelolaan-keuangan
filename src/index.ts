import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import supabase from "./lib/db";
import { clientEndpoint } from "./lib/data";
import bodyParser from "body-parser";
import { TransactionFormData } from "./@types/Transaction";
import { validateTransaction } from "./utils/transaction-utils";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/transaction", async (req: Request, res: Response) => {
  let data = await supabase.from("transaction").select("*");

  res.json(data.data);
});

app.post("/transaction/add", async(req:Request, res:Response) => {

  const formData:TransactionFormData = req.body;

  const test = validateTransaction(formData);

  console.log(test)

  // console.log(formData)

  return res.redirect(`${clientEndpoint.github}/transaction/add`)
  
  // const errors: Transaction.ErrorsTransaction = {} as Transaction.ErrorsTransaction;
  // console.log(typeTransaction)

  // if (isNaN(dateTransaction.getTime())) {
  //   errors.date = "Tanggal belum diisi";
  // }

  // if (dateTransaction > new Date()) {
  //   errors.date = "Tanggal transaksi tidak boleh dari masa depan";
  // }

  // if (typeTransaction === "null") {
  //   errors.type = "Tipe transaksi belum dipilih";
  // }

  // if (isNaN(totalTransaction)) {
  //   errors.total = "Total Transaksi harus berupa angka";
  // }

  // if (totalTransaction === 0) {
  //   errors.total = "Total transaksi tidak boleh 0";
  // }

  // const sameDate = oldData.find((d) => {
  //   return d.header === dateTransaction.toString();
  // });

  // if (Object.keys(errors).length > 0) {
  //   return res.json({ errors });
  // }

  // const dataBody: Transaction.TransactionBodyType = {
  //   asset: assetsTransaction,
  //   category: categoryTransaction,
  //   item: noteTransaction,
  //   price,
  // };

  // const finalData: Transaction.TransactionType = {
  //   header: String(dateTransaction),
  //   body: [],
  // };

  // return res.json({url: "/transaction"});
  
  // res.json({msg:"OK"})
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
