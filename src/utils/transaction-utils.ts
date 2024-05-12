import { ZodError, z } from "zod";
import { TransactionFormData } from "../@types/Transaction";

const TransactionFormDataSchema = z.object({
  typeTransaction: z.enum(["Pemasukan", "Pengeluaran"]),
  totalTransaction: z.number(),
  dateTransaction: z.string(),
  categoryTransaction: z.string(),
  assetsTransaction: z.string(),
  noteTransaction: z.string(),
  price: z.number(),
});

// TODO :  Fix ini 

export function validateTransaction(formData: TransactionFormData) {
  try {
    TransactionFormDataSchema.parse(FormData);
    return { isValid: true, errors: null };
  } catch (error) {
    return { isValid: false, error };
  }
}
