import {
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
} from "../../@types/Transaction";
import supabase from "../lib/db";
import express, { Request, Response } from "express";
import {
  encryptTransactionData,
  getTransactionData,
  transactionAllocation,
  validateTransaction,
} from "../utils/transaction-utils";
import CryptoJS from "crypto-js";
import { getUser, getUserData } from "../utils/general-utils";
import { AccountData } from "../../@types/Account";

const transactionRoute = express.Router();

transactionRoute.get("/", async (req: Request, res: Response) => {
  const userId = req.headers["user-id"] as string;

  let data = await getUserData(userId);

  if (!data) return res.status(200).json({ success: false, data: null });

  let resDb: TransactionType[] = [];

  const transactionData: TransactionType | TransactionType[] = JSON.parse(
    CryptoJS.AES.decrypt(data.user_transaction, userId).toString(
      CryptoJS.enc.Utf8
    )
  );

  if (Array.isArray(transactionData)) resDb = transactionData;
  else resDb.push(transactionData);

  res.status(200).json({ success: true, data: resDb });
});

transactionRoute.post("/add", async (req: Request, res: Response) => {
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

  /**
   * * User Section Start
   */

  // Temukan User
  const user = await getUser(userId);

  // Jika user tidak ditemukan, tampilkan pesan error
  if (!user) throw new Error("Akun tidak ditemukan");

  // Temukan data user
  const userData = await getUserData(userId);

  // Jika data user tidak ditemukan, buat data baru di database untuk user tersebut
  if (!userData) {
    await supabase.from("user_data").insert({ userId: user.uid });
  }

  /**
   * * User Section End
   */

  /**
   * * Validation Start
   */

  // Validasi transaksi
  const validation = validateTransaction(formData);

  if (!validation.isValid)
    return res.status(422).json({ error: validation.error });

  /**
   * * Validation End
   */

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
    id: crypto.randomUUID(),
    header: String(dateTransaction),
    body: [],
  };

  /**
   * * Alokasi data Start
   */

  const allocation = await transactionAllocation(
    userData,
    dataBody,
    String(dateTransaction)
  );
  if (allocation) {
    const encryptData = CryptoJS.AES.encrypt(
      JSON.stringify(allocation),
      String(user.uid)
    ).toString();

    await supabase
      .from("user_data")
      .update({ user_transaction: encryptData })
      .eq("userId", user.uid);
  } else {
    finalData.body.push(dataBody);

    const encryptData = CryptoJS.AES.encrypt(
      JSON.stringify(finalData),
      String(user.uid)
    ).toString();

    const userTransactionData: AccountData = {
      userId: String(user.uid),
      user_transaction: encryptData,
    };

    await supabase.from("user_data").insert(userTransactionData);
  }
  /**
   * * Alokasi data End
   */
  return res.status(200).json(validation);
});

transactionRoute.put("/", async (req: Request, res: Response) => {
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

transactionRoute.get("/detail/:header", async (req: Request, res: Response) => {
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

transactionRoute.delete("/", async (req: Request, res: Response) => {
  const userId = req.headers["user-id"] as string;
  const body = req.body;

  if (!body || typeof body.id !== "string" || typeof body.uid !== "string") {
    return res.status(400).json({ message: "Data permintaan tidak valid" });
}

  const user = await getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  const userData = await getUserData(String(user.uid));
  if (!userData) {
    return res.status(404).json({ message: "Data pengguna tidak ditemukan" });
}

  const transactions = getTransactionData(
    String(userData.user_transaction),
    String(userData.userId)
  );
  if (!transactions) {
    return res.status(404).json({ message: "Data transaksi tidak ditemukan" });
}

  const filteredTransaction = transactions
    .find((d) => d.id === body.id)
    ?.body.filter((d) => d.uid !== body.uid);

  if (filteredTransaction) {
    transactions.find((d) => d.id === body.id)!.body = filteredTransaction;
  }

  const newTransaction = transactions.filter((d) => d.body.length !== 0);

  const encryptData = encryptTransactionData(
    JSON.stringify(newTransaction),
    String(user.uid)
  );

  await supabase
    .from("user_data")
    .update({ user_transaction: encryptData })
    .eq("userId", String(user.uid));

  return res.status(200).json({ message: "Data berhasil dihapus" });
});

export default transactionRoute;
