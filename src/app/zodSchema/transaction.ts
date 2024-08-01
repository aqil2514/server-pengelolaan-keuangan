import { z } from "zod";
import {
  setToMidnight,
} from "../utils/transaction-utils/misc";
import { validateTransferField } from "../utils/transaction-utils/validation";

export const TransactionFormDataSchema = z
  .object({
    typeTransaction: z.enum(["Pemasukan", "Pengeluaran", "Transfer"], {
      message: "Tipe transaksi tidak diizinkan",
    }),
    totalTransaction: z.number({
      message: "Total transaksi harus berupa angka",
    }),
    dateTransaction: z.coerce
      .date({
        message: "Transaksi harus berupa tanggal",
        invalid_type_error: "Tanggal harus diisi",
      })
      .refine((date) => setToMidnight(date) <= setToMidnight(new Date()), {
        message: "Transaksi tidak boleh dari masa depan",
      }),
    categoryTransaction: z.string().min(1, "Category transaksi belum diisi"),
    assetsTransaction: z.string().min(1, "Aset transaksi belum diisi"),
    noteTransaction: z.string().min(1, "Catatan transaksi belum diisi"),
    fromAsset: z.string().optional(),
    toAsset: z.string().optional(),
    billTransaction: z.number().optional(),
    descriptionTransaction: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    validateTransferField(data, ctx);
  });
