import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  AccountDB,
  AccountRegister,
  AccountResponse,
  AccountUser,
} from "../../@types/Account";
import {
  createDataUser,
  isValidEmail,
  validatePassword,
  validateRegistration,
} from "../utils/account-utils";
import supabase from "../lib/db";
import { z } from "zod";
const accountRoute = express.Router();

accountRoute.post("/register", async (req: Request, res: Response) => {
  const data: AccountRegister = req.body;

  const validation = validateRegistration(data);
  if (!validation.isValid) {
    const result: AccountResponse[] = (validation.errors || []).map((d) => {
      return {
        success: false,
        message: d.message,
        path: d.path,
        notifMessage: d.notifMessage,
      };
    });

    return res.status(422).json({ result });
  }

  const passwordValidation = validatePassword(
    data.password,
    data.confirmPassword
  );
  if (!passwordValidation.isSame) {
    const result: AccountResponse[] = [
      {
        success: false,
        message: "Password tidak sama",
        path: "confirmPassword",
        notifMessage: "Password tidak sama",
      },
    ];
    return res.status(422).json({ result });
  }

  if (
    data.password.toLowerCase().trim() === data.username.toLowerCase().trim()
  ) {
    const result: AccountResponse[] = [
      {
        success: false,
        message: "Password tidak boleh sama dengan username",
        path: "password",
        notifMessage: "Password sama dengan username",
      },
    ];
    return res.status(422).json({ result });
  }

  const isThere = await supabase
    .from("user")
    .select("*")
    .eq("username", data.username.toLowerCase().trim());

  if (isThere.data?.length !== 0) {
    const result: AccountResponse[] = [
      {
        success: false,
        message: `Akun dengan username ${data.username} sudah terdaftar. Silahkan login`,
        path: "account-found",
        notifMessage: "Akun sudah ada",
      },
    ];
    return res.status(422).json({ result });
  }

  const isThereEmail = await supabase
    .from("user")
    .select("*")
    .eq("email", data.email.toLowerCase().trim());
  if (isThereEmail.data?.length !== 0) {
    const result: AccountResponse[] = [
      {
        success: false,
        message: `Akun dengan email ${data.email} sudah terdaftar. Silahkan login`,
        path: "account-found",
        notifMessage: "Email sudah terdaftar",
      },
    ];
    return res.status(422).json({ result });
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const finalData: AccountDB = {
    uid: crypto.randomUUID(),
    username: data.username.toLowerCase(),
    password: hashedPassword,
    email: data.email,
    config: {
      currency: data.currency,
      language: data.language,
      purposeUsage: data.purposeUsage,
    },
    privacy: {
      securityQuiz: data.securityQuiz,
      securityAnswer: data.securityAnswer,
    },
  };

  await supabase.from("user").insert(finalData);
  await createDataUser(String(finalData.uid));

  return res.status(200).json({ sucess: true });
});

accountRoute.post("/login", async (req: Request, res: Response) => {
  const { email:credential, password } = req.body;

  const isEmail = isValidEmail(credential);
  const field = isEmail ? "email": "username";

  const { data: users, error } = await supabase
    .from("user")
    .select("*")
    .eq(field, credential);
  if (error || users.length === 0)
    return res
      .status(404)
      .json({ success: false, message: "Akun tidak ditemukan" });

  const [userAccount] = users;
  const isCompared = await bcrypt.compare(password, userAccount.password);
  if (!isCompared)
    return res.status(401).json({ success: false, message: "Password salah" });

  const { uid, username, privacy, config, email } = userAccount;

  await createDataUser(uid);

  return res
    .status(200)
    .json({ user: { uid, username, email, privacy, config } });
});

accountRoute.get("/getUser", async (req: Request, res: Response) => {
  const { email } = req.query;

  const { data: users, error } = await supabase
    .from("user")
    .select("*")
    .eq("email", email);
  if (error)
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server" });

  let userAccount: AccountDB = users[0];

  if (!userAccount) {
    const userCreate = {
      username: "no setting",
      privacy: {} as AccountDB["privacy"],
      config: {} as AccountDB["config"],
      password: "no setting",
      email: String(email),
    };

    const { data, error } = await supabase
      .from("user")
      .insert(userCreate)
      .select("*");
    if (error)
      return res
        .status(500)
        .json({ success: false, message: "Gagal membuat akun baru" });

    userAccount = data[0];

    await createDataUser(String(userAccount.uid));
  }

  const { uid, username, privacy, config } = userAccount;

  return res
    .status(200)
    .json({ user: { uid, username, email, privacy, config } });
});

export default accountRoute;
