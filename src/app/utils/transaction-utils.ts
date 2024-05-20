import { ZodError, ZodIssue, isValid, z } from "zod";
import { TransactionFormData } from "../../@types/Transaction";

const TransactionFormDataSchema = z.object({
  typeTransaction: z.enum(["Pemasukan", "Pengeluaran"], {
    message: "Tipe transaksi tidak diizinkan",
  }),
  totalTransaction: z.number({ message: "Total transaksi harus berupa angka" }),
  dateTransaction: z.string({ message: "Transaksi harus berupa tanggal" }),
  categoryTransaction: z.string().min(1, "Category transaksi belum diisi"),
  assetsTransaction: z.string().min(1, "Aset transaksi belum diisi"),
  noteTransaction: z.string().min(1, "Catatan transaksi belum diisi"),
});

export function validateTransaction(formData: TransactionFormData) {
  try {
    TransactionFormDataSchema.parse(formData);
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { isValid: false, error };
    }
  }

  return { isValid: false };
}
