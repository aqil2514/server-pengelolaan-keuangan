import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  AccountDB,
  AccountRegister,
  AccountResponse,
} from "../../@types/Account";
import { validatePassword, validateRegistration } from "../utils/account-utils";
import supabase from "../lib/db";
const accountRoute = express.Router();

accountRoute.post("/register", async (req: Request, res: Response) => {
  const data: AccountRegister = req.body;

  const validation = validateRegistration(data);
  if (!validation.isValid) {
    const result: AccountResponse[] = (validation.error?.issues || []).map(
      (d) => {
        return {
          error: true,
          success: false,
          message: d.message,
          path: String(d.path[0]),
        };
      }
    );

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
        error: true,
        message: "Password tidak sama",
        path: "confirmPassword",
      },
    ];
    return res.status(422).json({ result });
  }

  const isThere = await supabase
    .from("user")
    .select("*")
    .eq("username", data.username);
  if (isThere.data?.length !== 0) {
    const result: AccountResponse[] = [
      {
        success: false,
        error: true,
        message: `Akun dengan username ${data.username} sudah ada di database`,
        path: "account-found",
      },
    ];
    return res.status(422).json({ result });
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const finalData: AccountDB = {
    username: data.username,
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

export default accountRoute;
