import { ZodError, z } from "zod";
import { AccountData, AccountRegister } from "../../@types/Account";
import { ErrorValidationResponse } from "../../@types/General";
import { AssetsData } from "../../@types/Assets";
import { encryptAssets } from "./asset-utils";
import supabase from "../lib/db";

const accountRegisterSchema = z.object({
  username: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, {
    message:
      "Username minimal 6 karakter dan minimal harus mengandung 1 huruf dan 1 angka",
  }),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message:
      "Password minimal harus 8 karakter, terdiri satu huruf besar, satu huruf kecil, dan satu angka",
  }),
  email: z.string().email({ message: "Alamat email tidak valid" }),
  currency: z.enum(["IDR", "USD", "EUR"], {
    message: "Mata uang tidak tersedia atau belum didukung",
  }),
  language: z.enum(["ID", "EN"], {
    message: "Bahasa yang dipilih belum tersedia",
  }),
  purposeUsage: z.enum(["Individu", "Organization"], {
    message: "Tujuan penggunaan tidak tersedia",
  }),
  securityQuiz: z.string(),
  securityAnswer: z.string(),
});

export async function createDataUser(id: string) {
  try {
    // Validate ID
    if (!id) {
      throw new Error("Invalid user ID");
    }

    // Check if user data already exists
    const { data: existingData, error: checkError } = await supabase
      .from("user_data")
      .select("*")
      .eq("userId", id);

    if (checkError) {
      throw new Error(`Failed to check user data: ${checkError.message}`);
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

    // Encrypt Assets Data
    const encryptAssetData = encryptAssets(userAssetData, id);

    // Prepare User Data
    const userData: AccountData = {
      userId: id,
      user_assets: encryptAssetData,
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

export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  try {
    emailSchema.parse(email);
    return true;
  } catch (e) {
    return false;
  }
}

export function validateRegistration(formData: AccountRegister) {
  try {
    accountRegisterSchema.parse(formData);
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ErrorValidationResponse[] = error.issues.map((e) => {
        let notifMessage: string = "";
        const path = String(e.path[0]);

        if (path === "username") notifMessage = "Username tidak valid";
        else if (path === "password") notifMessage = "Password tidak valid";
        else if (path === "email") notifMessage = "Email tidak valid";
        else if (path === "language") notifMessage = "Bahasa tidak valid";
        else if (path === "purposeUsage")
          notifMessage = "Tujuan penggunaan tidak valid";
        else if (path === "securityQuiz")
          notifMessage = "Pertanyaan keamanan tidak valid";
        else if (path === "securityAnswer")
          notifMessage = "Jawaban keamanan tidak valid";

        return {
          message: e.message,
          notifMessage,
          path: String(e.path[0]),
        };
      });

      return { isValid: false, errors };
    }
  }

  return { isValid: false };
}

export function validatePassword(password: string, confirmPassword: string) {
  if (password !== confirmPassword) return { isSame: false };
  return { isSame: true };
}
