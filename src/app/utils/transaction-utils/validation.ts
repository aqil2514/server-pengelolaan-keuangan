import { TransactionFormData, TransactionFormValidation, ValidateTransactionResult } from "src/@types/Transaction";
import { TransactionFormDataSchema } from "../../zodSchema/transaction";
import { z, ZodError } from "zod";

export function validateRequest(body: any): boolean {
    return body && typeof body.id === "string" && typeof body.uid === "string";
  }
  
  export function validateTransaction(
    formData: TransactionFormData
  ): ValidateTransactionResult {
    formData.dateTransaction = new Date(String(formData.dateTransaction));
  
    try {
      TransactionFormDataSchema.parse(formData);
      return { isValid: true, error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { isValid: false, error };
      }
    }
    return { isValid: false, error: null };
  }
  
  export function validateTransferField(
    data: TransactionFormValidation,
    ctx: z.RefinementCtx
  ) {
    // Jika tipe transaksinya adalah "Transfer", fromAsset harus ada dan tidak boleh kosong
    if (
      data.typeTransaction === "Transfer" &&
      (!data.fromAsset || data.fromAsset.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Aset awal harus diisi untuk transaksi transfer",
        path: ["fromAsset"], // Jalur kesalahan untuk pesan error
      });
    }
  
    // Jika tipe transaksinya adalah "Transfer", toAsset harus ada dan tidak boleh kosong
    if (
      data.typeTransaction === "Transfer" &&
      (!data.toAsset || data.toAsset.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Aset tujuan harus diisi untuk transaksi transfer",
        path: ["toAsset"],
      });
    }
    if (data.typeTransaction === "Transfer" && data.toAsset === data.fromAsset) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Aset awal dan aset tujuan tidak boleh sama",
        path: ["sameAsset"],
      });
    }
  }
  