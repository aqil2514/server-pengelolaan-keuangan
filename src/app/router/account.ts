import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  AccountDB,
  AccountProfile,
  AccountRegister,
  AccountResponse,
  AccountUser,
} from "../../@types/Account";
import {
  createDataUser,
  createNewUserByEmail,
  isThereUser,
  isValidEmail,
  saveUser,
  securityUpdate,
  validatePassword,
  validateProfile,
  validateRegistration,
} from "../utils/account-utils";
import supabase from "../lib/db";
import {
  BasicResponse,
  ErrorValidationResponse,
  HttpResponse,
} from "../../@types/General";
import { getUserWithPassword } from "../utils/general-utils";
import { CD_SettingSecurityCore } from "../../@types/Setting";
import { STATUS_OK, STATUS_UNPROCESSABLE_ENTITY } from "../lib/httpStatusCodes";
const accountRoute = express.Router();

accountRoute.post("/register", async (req: Request, res: Response) => {
  const data: AccountRegister = req.body;

  const validation = validateRegistration(data);
  if (validation.status === "error") {
    const result: AccountResponse[] = (validation.data || []).map(
      (d: AccountResponse) => {
        return {
          success: false,
          message: d.message,
          path: d.path,
          notifMessage: d.notifMessage,
        };
      }
    );

    return res.status(validation.statusCode as number).json({
      message: "oke",
      status: "error",
      data: result,
    } as BasicResponse<AccountResponse[]>);
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
    return res.status(422).json({
      message: "Password sama dengan username",
      status: "error",
      data: result,
    } as BasicResponse<AccountResponse[]>);
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
    return res
      .status(STATUS_UNPROCESSABLE_ENTITY)
      .json({
        message: "Akun sudah ada",
        status: "error",
        data: result,
      } as BasicResponse<AccountResponse[]>);
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
    return res
      .status(STATUS_UNPROCESSABLE_ENTITY)
      .json({
        message: "Email sudah ada",
        status: "error",
        data: result,
      } as BasicResponse<AccountResponse[]>);
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
    statusFlags: {
      isHavePassword: true,
      isVerified: false,
      isHaveSecurityQuiz:
        data.securityQuiz && data.securityAnswer ? true : false,
    },
  };

  await supabase.from("user").insert(finalData);
  await createDataUser(String(finalData.uid));

  return res.status(STATUS_OK).json({ message:"Akun berhasil dibuat", status:"success", data:null } as BasicResponse<null>);
});

accountRoute.post("/login", async (req: Request, res: Response) => {
  const { email: credential, password } = req.body;

  const isEmail = isValidEmail(credential);
  const field = isEmail ? "email" : "username";

  if (!credential)
    return res
      .status(422)
      .json({ success: false, message: "Email atau username belum diisi" });

  if (!password)
    return res
      .status(422)
      .json({ success: false, message: "Password belum diisi" });

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

  const { uid, username, privacy, config, email, statusFlags } = userAccount;

  await createDataUser(uid);

  return res
    .status(200)
    .json({ user: { uid, username, email, privacy, config, statusFlags } });
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
    const newUser = await createNewUserByEmail(String(email));

    if(!newUser.data) throw new Error("Terjadi kesalahan saat membuat user baru")

    await createDataUser(String(newUser.data?.uid));

    userAccount = newUser.data;
  }

  const { uid, username, privacy, config, statusFlags } = userAccount;

  return res
    .status(200)
    .json({ user: { uid, username, email, privacy, config, statusFlags } });
});

accountRoute.put("/", async (req: Request, res: Response) => {
  const body = req.body;
  const data: AccountProfile = {
    ...body,
    currency: body.config.currency,
    language: body.config.language,
    purposeUsage: body.config.purposeUsage,
    config: undefined,
  };

  const validation = validateProfile(data);
  if (!validation.isValid) {
    const response: HttpResponse = {
      data: null,
      error: validation.error as ErrorValidationResponse[],
      message: "Validasi Gagal",
    };
    return res.status(422).json(response);
  }

  const user = await getUserWithPassword(body.uid);

  if (!user) {
    const error: ErrorValidationResponse[] = [
      {
        path: "username",
        message: "Username sudah digunakan. Gunakan yang lain",
        notifMessage: "Username sudah digunakan!",
      },
    ];
    const response: HttpResponse = {
      data,
      error,
      message: "Profile akun berhasil diubah",
    };
    return res.status(400).json(response);
  }

  const checkUser = await isThereUser({
    username: body.username,
    email: body.email,
    oldEmail: user.email,
    oldUsername: user.username,
  });

  if (!checkUser?.isValid) {
    const error: ErrorValidationResponse[] = [
      {
        path: "username",
        message: "Username sudah digunakan. Gunakan yang lain",
        notifMessage: "Username sudah digunakan!",
      },
    ];

    const response: HttpResponse = {
      data: null,
      error,
      message: error[0].notifMessage as string,
    };

    return res.status(400).json(response);
  }

  const finalData: AccountUser = {
    uid: user.uid,
    username: body.username === user.username ? user.username : body.username,
    config:
      JSON.stringify(user.config) === JSON.stringify(body.config)
        ? user.config
        : body.config,
    email: body.email === user.email ? user.email : body.email,
    privacy: user.privacy,
    statusFlags: {
      isHavePassword: user.password ? true : false,
      isVerified: user.statusFlags.isVerified,
      isHaveSecurityQuiz: user.statusFlags.isHaveSecurityQuiz,
    },
  };

  await saveUser(finalData);

  const response: HttpResponse = {
    data: finalData,
    error: null,
    message: "Profile akun berhasil diubah",
  };
  return res.status(200).json(response);
});

accountRoute.put("/security", async (req: Request, res: Response) => {
  const bodyData: CD_SettingSecurityCore = req.body;
  const { cta, securityData, securityOption, uid } = bodyData;

  if (!cta)
    return res.status(400).json({
      message: "Call To Action (CTA) belum diatur",
      status: "error",
    } as BasicResponse);

  const user = await getUserWithPassword(uid);

  if (!user)
    return res.status(404).json({
      message: "Akun tidak ditemukan",
      status: "error",
    } as BasicResponse);

  if (cta === "create-new-security") {
    const { confirmNewPassword, newPassword, securityAnswer, securityQuiz } =
      securityData;
    if (securityOption === "password-option") {
      const createNewPassword = await securityUpdate.newPassword(
        String(newPassword),
        String(confirmNewPassword),
        user
      );

      const { statusCode, status } = createNewPassword;
      const code = status === "success" ? 200 : 400;
      const httpCode = statusCode ? statusCode : code;

      return res.status(httpCode).json(createNewPassword);
    } else if (securityOption === "security-question-option") {
      const createNewQuiz = await securityUpdate.newSecurityUpdate(
        String(securityQuiz),
        securityAnswer,
        user,
        "create-new"
      );
      const { statusCode } = createNewQuiz;

      return res.status(Number(statusCode)).json(createNewQuiz);
    }
  } else if (cta === "change-security") {
    const {
      oldPassword,
      securityAnswer,
      confirmNewPassword,
      newPassword,
      securityQuiz,
    } = securityData;
    if (securityOption === "password-option") {
      const changePassword = await securityUpdate.updatePassword(
        oldPassword,
        String(newPassword),
        String(confirmNewPassword),
        user
      );
      const { statusCode } = changePassword;

      return res.status(Number(statusCode)).json(changePassword);
    } else if (securityOption === "security-question-option") {
      const createNewQuiz = await securityUpdate.newSecurityUpdate(
        String(securityQuiz),
        securityAnswer,
        user,
        "update"
      );
      const { statusCode } = createNewQuiz;

      return res.status(Number(statusCode)).json(createNewQuiz);
    }
  }

  return res.status(200).json({
    status: "success",
    message: "Keamanan berhasil diperbarui",
  } as BasicResponse);
});

export default accountRoute;
