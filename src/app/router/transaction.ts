import {
  TransactionBodyType,
  TransactionFormData,
  TransactionType,
} from "../../@types/Transaction";
import supabase from "../lib/db";
import express, { Request, Response } from "express";
import {
  editTransactionData,
  encryptTransactionData,
  getTransactionData,
  handleTransaction,
  handleValidationError,
  transactionAllocation,
  validateTransaction,
} from "../utils/transaction-utils";
import CryptoJS from "crypto-js";
import {
  getUser,
  getUserData,
  synchronizeUserData,
} from "../utils/general-utils";
import { AccountData } from "../../@types/Account";
import { BasicResponse, ErrorValidationResponse } from "../../@types/General";
import { STATUS_UNPROCESSABLE_ENTITY } from "../lib/httpStatusCodes";
import { isUserData } from "../utils/account-utils";

const transactionRoute = express.Router();

transactionRoute.get("/", async (req: Request, res: Response) => {
  const userId = req.headers["user-id"] as string;

  let data = await getUserData(userId);

  if (!data?.user_transaction)
    return res.status(200).json({ success: false, data: null });

  await synchronizeUserData(data, data.userId);

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
   * *User Section Start
   */
  const userData = await getUserData(userId);

  // Jika data user tidak ditemukan, buat data baru di database untuk user tersebut
  if (!userData) {
    await supabase.from("user_data").insert({ userId });
  }

  /**
   * * User Section End
   */

  /**
   * * Validation Start
   */

  // Validasi transaksi
  // const validation = validateTransaction(formData);

  // if (!validation.isValid) {
  //   const errors = handleValidationError(validation.error);

  //   if (!errors) throw new Error("Terjadi kesalahan saat penanganan error");

  //   return res
  //     .status(STATUS_UNPROCESSABLE_ENTITY)
  //     .json({
  //       message: errors[0].message,
  //       status: "error",
  //       data: errors,
  //     } as BasicResponse<ErrorValidationResponse[]>);
  // }

  /**
   * * Validation End
   */

  if(typeTransaction === "Pemasukan") {
    const handle = await handleTransaction.income(formData, userData as AccountData);
  }

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
      String(userId)
    ).toString();

    await supabase
      .from("user_data")
      .update({ user_transaction: encryptData })
      .eq("userId", userId);
  } else {
    finalData.body.push(dataBody);

    const encryptData = CryptoJS.AES.encrypt(
      JSON.stringify(finalData),
      String(userId)
    ).toString();

    const userTransactionData: AccountData = {
      userId: String(userId),
      user_transaction: encryptData,
    };

    await supabase
      .from("user_data")
      .update({ user_transaction: userTransactionData.user_transaction })
      .eq("userId", userTransactionData.userId);
  }
  /**
   * * Alokasi data End
   */
  return res.status(200).json({msg:"ok"});
});

transactionRoute.put("/", async (req: Request, res: Response) => {
  const userId = req.headers["user-id"] as string;

  const formData: TransactionFormData = req.body;

  const user = await getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  const userData = await getUserData(String(user.uid));
  if (!userData) {
    return res.status(404).json({ message: "Data pengguna tidak ditemukan" });
  }

  const validation = validateTransaction(formData);

  if (!validation.isValid) {
    const errors = validation.error?.issues.map((e) => {
      let notifMessage: ErrorValidationResponse["notifMessage"] = "";
      const path = String(e.path[0]);

      if (path === "typeTransaction")
        notifMessage = "Tipe transaksi tidak valid";
      else if (path === "totalTransaction")
        notifMessage = "Nominal transaksi tidak valid";
      else if (path === "dateTransaction")
        notifMessage = "Tanggal transaksi tidak valid";
      else if (path === "categoryTransaction")
        notifMessage = "Kategori transaksi tidak valid";
      else if (path === "assetsTransaction")
        notifMessage = "Asset transaksi tidak valid";
      else if (path === "noteTransaction")
        notifMessage = "Item transaksi tidak valid";
      const error: ErrorValidationResponse = {
        message: e.message,
        path: e.path[0] as string,
        notifMessage,
      };

      return error;
    });

    if (!errors) throw new Error("Terjadi kesalahan saat penanganan error");

    return res.status(422).json({ errors });
  }

  const transactions = getTransactionData(
    String(userData.user_transaction),
    userId
  );

  const resultEdit = editTransactionData(transactions, formData);

  const encryptData = encryptTransactionData(
    JSON.stringify(resultEdit),
    userId
  );

  await supabase
    .from("user_data")
    .update({ user_transaction: encryptData })
    .eq("userId", userId);

  return res.status(200).json({ message: "Data transaksi berhasil diubah" });
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
