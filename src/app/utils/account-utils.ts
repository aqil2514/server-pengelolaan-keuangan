import { ZodError, z } from "zod";
import { AccountRegister } from "../../@types/Account";
import { ErrorValidationResponse } from "../../@types/General";

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
