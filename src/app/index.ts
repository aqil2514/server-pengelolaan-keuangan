import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import supabase from "./lib/db";
// import { clientEndpoint } from "./lib/data";
import bodyParser from "body-parser";
import {
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
} from "../@types/Transaction";
import { validateTransaction } from "./utils/transaction-utils";
import cors from "cors";
import accountRoute from "./router/account";
import CryptoJS from "crypto-js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const account = accountRoute;

app.use('/api/account', account);

app.get("/", (req, res) => res.send("Express on Vercel"));

app.get("/api/transaction", async (req: Request, res: Response) => {
  let data = await supabase.from("transaction").select("*");

  res.json(data.data);
});

app.post("/api/transaction/add", async (req: Request, res: Response) => {
  const formData: TransactionFormData = req.body;
  const {
    dateTransaction,
    noteTransaction,
    typeTransaction,
    totalTransaction,
    assetsTransaction,
    categoryTransaction,
    userId,
  } = formData;

  const validation = validateTransaction(formData);

  console.log(userId)

  if (!validation.isValid)
    return res.status(422).json({ error: validation.error });

  const dataBody: TransactionBodyType = {
    uid: crypto.randomUUID(),
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

  const encryptData = CryptoJS.AES.encrypt(JSON.stringify(finalData), "secret-key")

  console.log(encryptData.toString());

  const decryptData = CryptoJS.AES.decrypt(encryptData.toString(), "secret-key");
  console.log(JSON.parse(decryptData.toString(CryptoJS.enc.Utf8)))

  // const dataDb = await supabase.from("transaction").select("*");
  // const transaction = dataDb.data as unknown as TransactionType[];

  // const sameData = transaction.find(
  //   (p) => new Date(p.header).toISOString() === String(dateTransaction)
  // );

  // if (sameData) {
  //   sameData.body.push(dataBody);

  //   const response = await supabase
  //     .from("transaction")
  //     .update({ body: sameData.body })
  //     .eq("header", dateTransaction)
  //     .select();

  //   if (response.error) {
  //     return res.status(response.status).json({ message: response.statusText });
  //   }

  //   return res.status(200).json({ message: "Data berhasil ditambahkan" });
  // }

  // finalData.body.push(dataBody);
  // await supabase.from("transaction").insert(finalData);

  return res.status(200).json(validation);

  return res.json({url: "/transaction"});

});

app.put("/api/transaction", async (req: Request, res: Response) => {
  const formData: TransactionFormData = req.body;
  const {
    idTransaction,
    uidTransaction,
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
    uid: String(uidTransaction),
    asset: String(assetsTransaction),
    category: String(categoryTransaction),
    item: String(noteTransaction),
    price:
      typeTransaction === "Pemasukan"
        ? Number(totalTransaction)
        : Number(totalTransaction),
  };

  const finalData: TransactionType = {
    header: String(dateTransaction),
    body: [],
  };

  const dbRes = await supabase
    .from("transaction")
    .select("*")
    .eq("id", idTransaction);
  const isNullData = !dbRes.data || dbRes.data.length === 0;
  finalData.body.push(dataBody);

  if (isNullData)
    return res.status(404).json({ message: "Data tidak ditemukan" });
  const dbData: TransactionType = dbRes.data[0];
  const indexData = dbData.body.findIndex((item) => item.uid === dataBody.uid);
  dbData.body[indexData] = dataBody;

  // Pengecekan tanggal
  if (String(dateTransaction) !== dbData.header) {
    const checkData = await supabase
      .from("transaction")
      .select("*")
      .eq("header", dateTransaction);

    const dataIsThere = checkData.data && checkData.data.length;

    switch (dataIsThere) {
      // Kasus 1 = Bagaimana jika tanggal data baru belum ada di database?
      case 0:
        console.log("Kasus 1 Dieksekusi");
        const oldData1 = dbData.body.filter((d) => d.uid !== uidTransaction);
        const newData = dbData.body.filter((d) => d.uid === uidTransaction);
        finalData.body = newData;

        if (oldData1.length === 0) {
          await supabase.from("transaction").delete().eq("id", idTransaction);
        } else {
          await supabase
            .from("transaction")
            .update({ body: oldData1 })
            .eq("id", idTransaction);
        }

        if (dbRes.data[0].body.length === 0) {
          await supabase.from("transaction").delete().eq("id", idTransaction);
        }

        await supabase.from("transaction").insert(finalData);
        return res
          .status(200)
          .json({ message: "Data Transaksi berhasil diubah" });

      default:
        console.log("Kasus 2 Dieksekusi");
        // Kasus 2 = Bagaimana jika tanggal data baru sudah ada di database?
        const selectedOldData2 = dbData.body.find(
          (d) => d.uid === uidTransaction
        );
        const oldData2 = dbData.body.filter((d) => d.uid !== uidTransaction);
        const newData2 = checkData.data![0].body;

        newData2.push(selectedOldData2);
        dbData.body = oldData2;

        await supabase
          .from("transaction")
          .update({ body: newData2 })
          .eq("header", dateTransaction);

        if (dbRes.data[0].body.length === 0) {
          await supabase.from("transaction").delete().eq("id", idTransaction);
        } else {
          await supabase
            .from("transaction")
            .update({ body: oldData2 })
            .eq("header", dateTransaction);
        }
    }
  }

  await supabase
    .from("transaction")
    .update({ body: dbData.body })
    .eq("id", idTransaction);
  return res.json({ message: "Data transaksi berhasil diubah" });
});

app.get("/api/transaction/detail/:header", async (req: Request, res: Response) => {
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

app.delete("/api/transaction", async (req: Request, res: Response) => {
  const body = req.body;
  const db = await supabase.from("transaction").select("*").eq("id", body.id);

  if (db.error) return res.status(db.status).json({ message: db.statusText });

  const dbData: TransactionType = db.data[0];
  const newData = dbData.body.filter((d) => d.uid !== body.uid);

  if (dbData.body.length === 1) {
    await supabase.from("transaction").delete().eq("id", dbData.id);
  } else {
    await supabase
      .from("transaction")
      .update({ body: newData })
      .eq("id", dbData.id);
  }

  return res.status(200).json({ message: "Data berhasil dihapus" });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;