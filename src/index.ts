import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import supabase from "./lib/db";
import { clientEndpoint } from "./lib/data";
import bodyParser from "body-parser";
import {
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
} from "./@types/Transaction";
import { validateTransaction } from "./utils/transaction-utils";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/transaction", async (req: Request, res: Response) => {
  let data = await supabase.from("transaction").select("*");

  res.json(data.data);
});

app.post("/transaction/add", async (req: Request, res: Response) => {
  const formData: TransactionFormData = req.body;
  const {
    dateTransaction,
    noteTransaction,
    typeTransaction,
    totalTransaction,
    assetsTransaction,
    categoryTransaction,
  } = formData;

  const validation = validateTransaction(formData);

  if (!validation.isValid)
    return res.status(422).json({ error: validation.error });

  const dataBody: TransactionBodyType = {
    asset: String(assetsTransaction),
    category: String(categoryTransaction),
    item: String(noteTransaction),
    price:
      typeTransaction === "Pemasukan"
        ? Number(totalTransaction)
        : Number(totalTransaction) * -1,
  };

  const finalData: TransactionType = {
    header: String(dateTransaction),
    body: [],
  };

  const dataDb = await supabase.from("transaction").select("*");
  const transaction = dataDb.data as unknown as TransactionType[];

  const sameData = transaction.find(
    (p) => new Date(p.header).toISOString() === String(dateTransaction)
  );

  if (sameData) {
    sameData.body.push(dataBody);

    const response = await supabase
      .from("transaction")
      .update({ body: sameData.body })
      .eq("header", dateTransaction)
      .select();

    if (response.error) {
      return res.status(response.status).json({ message: response.statusText });
    }

    return res.status(200).json({ message: "Data berhasil ditambahkan" });
  }

  finalData.body.push(dataBody);
  await supabase.from("transaction").insert(finalData);

  return res.status(200).json(validation);

  // return res.json({url: "/transaction"});

  // res.json({msg:"OK"})
});

app.get("/transaction/detail/:header", async (req: Request, res: Response) => {
  const { header } = req.params;

  const dbRes = await supabase
    .from("transaction")
    .select("*")
    .eq("header", header);

  if (dbRes.error) {
    return res.status(dbRes.status).json({ msg: dbRes.statusText });
  }

  return res.status(200).json({ msg: "Sukses", data: dbRes.data });
});

app.delete("/transaction", async (req: Request, res: Response) => {
  const body = req.body;
  const db = await supabase
    .from("transaction")
    .select("*")
    .eq("header", body.header);

  if (db.error) return res.status(db.status).json({ message: db.statusText });

  const dbData: TransactionType = db.data[0];

  if (dbData.body.length === 1) {
    await supabase.from("transaction").delete().eq("header", dbData.header);
  } else {
    dbData.body.splice(body.index, 1);

    await supabase
      .from("transaction")
      .update({ body: dbData.body })
      .eq("header", dbData.header);
  }

  return res.status(200).json({ message: "Data berhasil dihapus" });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
