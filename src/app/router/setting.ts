import express, { Request, Response } from "express";
import { CD_SettingSecurity } from "../../@types/Setting";
import { getUserWithPassword } from "../utils/general-utils";
import bcrypt from "bcrypt";
import { BasicResponse } from "../../@types/General";

const settingRoute = express.Router();

function validateSecurityInput(req: Request, res: Response, next: Function) {
  const { password, securityAnswer, securityOption, uid }: CD_SettingSecurity =
    req.body;
  if (securityOption === "password-option") {
    if (!password)
      return res.status(401).json({
        status: "error",
        message: "Password belum diisi",
        data: null,
      });
  }
  else if (securityOption === "security-question-option"){
    if(!securityAnswer)return res.status(401).json({
        status: "error",
        message: "Jawaban keamanan belum diisi",
        data: null,
      });
  }
  next();
}

settingRoute.post(
  "/security",
  validateSecurityInput,
  async (req: Request, res: Response) => {
    const {
      password,
      securityAnswer,
      securityOption,
      uid,
    }: CD_SettingSecurity = req.body;

    const user = await getUserWithPassword(uid);

    if (!user) throw new Error("Akun tidak ada");

    if (securityOption === "password-option") {
      const isCompared = await bcrypt.compare(password, user.password);
      if (!isCompared)
        return res.status(401).json({
          message: "Password tidak sama",
          status: "error",
        } as BasicResponse);

      return res.status(200).json({
        message: "Verifikasi berhasil",
        status: "success",
      } as BasicResponse);
    }

    if (
      securityAnswer.toLowerCase() !== user.privacy.securityAnswer.toLowerCase()
    )
      return res.status(401).json({
        message: "Jawaban keamanan tidak sama",
        status: "error",
      } as BasicResponse);

    return res.status(200).json({
      message: "Verifikasi berhasil",
      status: "success",
    } as BasicResponse);
  }
);

export default settingRoute;
