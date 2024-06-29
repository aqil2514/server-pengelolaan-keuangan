import { ZodError, z } from "zod";
import {
  AccountDB,
  AccountData,
  AccountProfile,
  AccountRegister,
  AccountSecurityUpdateFunctions,
  AccountStatusFlags,
  AccountUser,
  ValidationFunction,
} from "../../@types/Account";
import { BasicResponse, ErrorValidationResponse } from "../../@types/General";
import { AssetsData } from "../../@types/Assets";
import { encryptAssets } from "./asset-utils";
import supabase from "../lib/db";
import { TransactionType } from "../../@types/Transaction";
import { encryptTransactionData } from "./transaction-utils";
import bcrypt from "bcrypt";
import {
  accountProfileSchema,
  accountRegisterSchema,
} from "../zodSchema/account";
import { STATUS_OK, STATUS_UNPROCESSABLE_ENTITY } from "../lib/httpStatusCodes";

interface ValidationResponse {
  isValid: boolean;
  errors: ErrorValidationResponse[] | null;
}

export function validateProfile(data: AccountProfile) {
  try {
    const validation = accountProfileSchema.parse(data);
    return {
      isValid: true,
      data: validation,
      error: null,
      message: "Validasi berhasil",
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const notifMessages: Record<string, string> = {
        username: "Username tidak valid",
        email: "Email tidak valid",
        language: "Bahasa tidak valid",
        purposeUsage: "Tujuan penggunaan tidak valid",
        currency: "Mata uang tidak valid",
      };

      const errors: ErrorValidationResponse[] = error.issues.map((e) => {
        const path = String(e.path[0]);
        const notifMessage = notifMessages[path];

        return {
          message: e.message,
          notifMessage,
          path,
        };
      });
      return {
        isValid: false,
        data: null,
        error: errors,
        message: "Validasi gagal",
      };
    }
    return { isValid: false, data: null, error, message: "Validasi gagal" };
  }
}

/**
 * Validasi pendaftaran
 * @param {AccountRegister} formData Form Data yang digunakan untuk registrasi
 * @returns {ValidationResponse} Hasil validasi
 */
export function validateRegistration(formData: AccountRegister): BasicResponse {
  try {
    accountRegisterSchema.parse(formData);
    return {
      message: "Validasi data Berhasil",
      statusCode: STATUS_OK,
      status: "success",
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const notifMessages: Record<string,string> = {
        username: "Username tidak valid",
        password:"Password tidak valid",
        email: "Email tidak valid",
        language: "Bahasa tidak valid",
        purposeUsage: "Tujuan penggunaan tidak valid",
        securityQuiz: "Pertanyaan keamanan tidak valid",
        securityAnswer: "Jawaban keamanan tidak valid",
      };
      const errors: ErrorValidationResponse[] = error.issues.map((e) => {
        const path = String(e.path[0]);
        const notifMessage = notifMessages[path]

        return {
          message: e.message,
          notifMessage,
          path: String(e.path[0]),
        };
      });

      const response: BasicResponse<ErrorValidationResponse[]> = {
        message: "Validasi gagal",
        status: "error",
        statusCode: STATUS_UNPROCESSABLE_ENTITY,
        data:errors,
      };

      return response;
    }
  }

  const response: BasicResponse={
    message:"Validasi akun",
    status: "success",
    statusCode: STATUS_OK
  }

  return response;
}

export async function createDataUser(id: string) {
  try {
    // Validasi ID
    if (!id) {
      throw new Error("Invalid user ID");
    }

    // Cek apakah user sudah memiliki data?
    const { data: existingData, error: checkError } = await supabase
      .from("user_data")
      .select("*")
      .eq("userId", id);

    if (checkError) {
      throw new Error(`Gagal memeriksa data user: ${checkError.message}`);
    }

    if (existingData && existingData.length > 0) {
      return;
    }

    // Default Assets
    const userAssetData: AssetsData[] = [
      {
        name: "Kantong Utama",
        group: "Tunai",
        amount: 0,
        description: "Kantong yang berbagai macam uang",
      },
      {
        name: "Bank BRI",
        group: "Rekening",
        amount: 0,
        description: "ATM untuk menyimpang uang",
      },
      {
        name: "Dana",
        group: "E-Wallet",
        amount: 0,
        description: "Untuk Jajan",
      },
    ];

    // Default Transaction
    const userTransactionData: TransactionType[] = [];

    // Encrypt Assets Data
    const encryptAssetData = encryptAssets(userAssetData, id);

    // Encrypt Transaction Data
    const encryptTransaction = encryptTransactionData(
      JSON.stringify(userTransactionData),
      id
    );

    // Prepare User Data
    const userData: AccountData = {
      userId: id,
      user_assets: encryptAssetData,
      user_transaction: encryptTransaction,
    };

    // Insert User Data into Database
    const { error: insertError } = await supabase
      .from("user_data")
      .insert(userData);
    if (insertError) {
      throw new Error(`Failed to insert user data: ${insertError.message}`);
    }

    console.info("User data created successfully for user ID:", id);
  } catch (error) {
    console.error("Error creating user data:", error);
  }
}

export async function saveUser(data: AccountUser | AccountDB) {
  if (isAccountDB(data)) {
    console.log(data);
    const resultSaving = await supabase
      .from("user")
      .update(data)
      .eq("uid", data.uid);
    return resultSaving;
  }

  const resultSaving = await supabase
    .from("user")
    .update(data)
    .eq("uid", data.uid);
  return resultSaving;
}

function isAccountDB(data: any): data is AccountDB {
  return data && typeof data.password === "string";
}

interface IsThereUserFunctionArgs {
  username: string;
  email: string;
  oldUsername: string;
  oldEmail: string;
}

export async function isThereUser({
  username,
  email,
  oldEmail,
  oldUsername,
}: IsThereUserFunctionArgs) {
  // Cek keberadaan username
  if (username && username !== oldUsername) {
    const { data: usernameAccount, error: usernameError } = await supabase
      .from("user")
      .select("*")
      .eq("username", username);

    if (usernameError) {
      return {
        isValid: false,
        message: "Terjadi kesalahan saat memeriksa username",
      };
    }

    if (usernameAccount && usernameAccount.length > 0) {
      return {
        isValid: false,
        message: "Username sudah ada",
      };
    }
  }

  // Cek keberadaan email
  if (email && email !== oldEmail) {
    const { data: emailAccount, error: emailError } = await supabase
      .from("user")
      .select("*")
      .eq("email", email);

    if (emailError) {
      return {
        isValid: false,
        message: "Terjadi kesalahan saat memeriksa email",
      };
    }

    if (emailAccount && emailAccount.length > 0) {
      return {
        isValid: false,
        message: "Email sudah ada",
      };
    }
  }

  return {
    isValid: true,
    message: "Username dan email tersedia",
  };
}

export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  try {
    emailSchema.parse(email);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 *
 * @param {string} password Password pertama
 * @param {string} confirmPassword Password kedua yang harus sama
 * @returns {boolean}
 */
export function validatePassword(password: string, confirmPassword: string) {
  if (password !== confirmPassword) return { isSame: false };
  return { isSame: true };
}

const validation: ValidationFunction = {
  validatePassword(password: string): string | null {
    // Define password requirements
    const minLength = 8;
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasNumber = /[0-9]/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (!password) return "Password belum diisi";

    if (password.length < minLength) {
      return `Password harus minimal ${minLength} karakter.`;
    }

    if (!hasUpperCase.test(password)) {
      return "Password harus mengandung minimal satu huruf besar.";
    }

    if (!hasLowerCase.test(password)) {
      return "Password harus mengandung minimal satu huruf kecil.";
    }

    if (!hasNumber.test(password)) {
      return "Password harus mengandung minimal satu angka.";
    }

    if (!hasSpecialChar.test(password)) {
      return "Password harus mengandung minimal satu karakter khusus.";
    }

    return null;
  },
  validateNewPassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): string | null {
    if (!oldPassword) return "Password lama belum diisi";
    if (!newPassword) return "Password baru belum diisi";
    if (!confirmPassword) return "Konfirmasi password baru belum diisi";

    const oldPasswordValidation = this.validatePassword(oldPassword);
    if (oldPasswordValidation) {
      return `Password lama tidak valid: ${oldPasswordValidation}`;
    }

    const newPasswordValidation = this.validatePassword(newPassword);
    if (newPasswordValidation) {
      return `Password baru tidak valid: ${newPasswordValidation}`;
    }

    if (newPassword !== confirmPassword) {
      return "Password baru dan konfirmasi password tidak cocok.";
    }

    if (oldPassword === newPassword) {
      return "Password baru tidak boleh sama dengan password lama.";
    }

    return null;
  },
};

/**
 * Function untuk mengatur update security user
 */
export const securityUpdate: AccountSecurityUpdateFunctions = {
  async newPassword(password, confirmPassword, user) {
    if (user.password) {
      const result: BasicResponse = {
        message: "Akun sudah memiliki password",
        status: "error",
        statusCode: 409,
      };

      return result;
    }

    const passwordValidation = validation.validatePassword(password);
    if (passwordValidation) {
      const result: BasicResponse = {
        message: passwordValidation,
        status: "error",
        statusCode: 422,
      };

      return result;
    }

    const clientData = {
      password,
      confirmPassword,
      user,
    };

    if (password !== confirmPassword) {
      const result: BasicResponse<null> = {
        message: "Password tidak sama",
        status: "error",
        statusCode: 400,
      };

      return result;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const statusFlags: AccountStatusFlags = clientData.user.statusFlags;

    statusFlags.isHavePassword = true;

    await supabase
      .from("user")
      .update({ password: hashedPassword, statusFlags })
      .eq("uid", clientData.user.uid);

    const result: BasicResponse<AccountDB> = {
      message: "Password baru berhasil dibuat",
      status: "success",
      data: clientData.user,
    };

    return result;
  },
  async newSecurityUpdate(question, answer, user, action) {
    if (action === "create-new") {
      if (user.privacy && user.privacy.securityQuiz) {
        const response: BasicResponse<null> = {
          message: "Akun sudah memiliki pertanyaan keamanan",
          status: "error",
          statusCode: 409,
          data: null,
        };
        return response;
      }
    }

    const newUser: AccountDB = {
      ...user,
      privacy: {
        ...user.privacy,
        securityAnswer: answer,
        securityQuiz: question,
      },
      statusFlags: {
        ...user.statusFlags,
        isHaveSecurityQuiz: true,
      },
    };

    await supabase.from("user").update(newUser).eq("uid", user.uid);

    const result: BasicResponse<AccountDB> = {
      message: "Keamanan berhasil diperbarui",
      status: "success",
      statusCode: 200,
      data: newUser,
    };

    return result;
  },
  async updatePassword(oldPassword, newPassword, confirmNewPassword, user) {
    const validationResult = validation.validateNewPassword(
      oldPassword,
      newPassword,
      confirmNewPassword
    );

    if (validationResult) {
      return {
        message: validationResult,
        status: "error",
        statusCode: 422,
      };
    }

    const isCompared = await bcrypt.compare(oldPassword, user.password);
    if (!isCompared) {
      return {
        message: "Password lama tidak sama",
        status: "error",
        statusCode: 400,
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const finalData: AccountDB = {
      ...user,
      password: hashedPassword,
    };

    await supabase.from("user").update(finalData).eq("uid", user.uid);

    return {
      message: "Ganti password berhasil",
      status: "success",
      statusCode: 200,
      data: user,
    };
  },
};
