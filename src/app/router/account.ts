import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  AccountDB,
  AccountRegister,
  AccountResponse,
  AccountUser,
} from "../../@types/Account";
import { validatePassword, validateRegistration } from "../utils/account-utils";
import supabase from "../lib/db";
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
        notifMessage:"Password tidak sama"
      },
    ];
    return res.status(422).json({ result });
  }

  if(data.password.toLowerCase().trim() === data.username.toLowerCase().trim()){
    const result: AccountResponse[] = [
      {
        success: false,
        message: "Password tidak boleh sama dengan username",
        path: "password",
        notifMessage:"Password sama dengan username"
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
        path: "password",
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

  return res.status(200).json({ sucess: true });
});

accountRoute.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const userDb = await supabase.from("user").select("*").eq("email", email);
  if (userDb.data && userDb.data?.length === 0)
    return res
      .status(404)
      .json({ success: false, message: "Akun tidak ditemukan" });
  const userAccount: AccountDB = userDb.data![0];

  const isCompared = await bcrypt.compare(password, userAccount.password);
  if (!isCompared)
    return res.status(401).json({ success: false, message: "Password salah" });

  const user: AccountUser = {
    uid: userAccount.uid,
    username: userAccount.username,
    email: userAccount.email,
    privacy: userAccount.privacy,
    config: userAccount.config,
  };

  return res.status(200).json({ user });
});

export default accountRoute;
