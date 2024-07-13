import { BasicResponse } from "./General";

/** Interface untuk data aset */
export interface AssetsData {
  /** Pengelompokan aset */
  group: string;
  /** Total awal aset */
  amount: number;
  /** Deskripsi aset */
  description: string;
  /** Nama aset */
  name: string;
  /** Warna tema aset */
  color: string;
}

/**
 * Data asset yang diambil dari form
 */
export interface AssetFormValues {
  /** Nama aset lama */
  oldAssetName: string;
  /** Nama aset */
  assetName: string;
  /** Nominal awal aset */
  assetNominal: number;
  /** Kategori aset */
  assetCategory: string;
  /** Kategori baru aset */
  newAssetCategory?: string;
  /** Deskripsi aset */
  assetDescription: string;
  /** Warna tema aset */
  assetColor: string;
}

// Interface untuk opsi penghapusan aset
export interface AssetDeleteOption {
  /**
   * Fungsi untuk menghapus transaksi yang berisi aset lama.
   * @param clientData - Data klien yang dibutuhkan untuk dekripsi.
   * @param encTransaction - Data transaksi terenkripsi.
   * @param oldAsset - Nama aset lama yang ingin dihapus dari transaksi.
   * @returns Promise yang menghasilkan array transaksi yang telah diperbarui.
   */
  deleteTransaction: (
    clientData: string,
    encTransaction: string,
    oldAsset: string
  ) => Promise<TransactionType[]>;

  /**
   * Fungsi untuk memindahkan transaksi dari aset lama ke aset baru.
   * @param deleteOption - Opsi yang menunjukkan aset target untuk pemindahan.
   * @param clientData - Data klien yang dibutuhkan untuk dekripsi.
   * @param encTransaction - Data transaksi terenkripsi.
   * @param oldAsset - Nama aset lama yang ingin dipindahkan.
   * @returns Promise yang menghasilkan array transaksi yang telah diperbarui.
   */
  moveTransaction: (
    deleteOption: string,
    clientData: string,
    encTransaction: string,
    oldAsset: string
  ) => Promise<TransactionType[]>;
}

/** Interface untuk kelola pemindahan aset */
export interface AssetTransferData {
  /**
   * Kurangi atau hapus aset tertentu. Digunakan untuk pemindahan aset
   * @param formData Form Data
   * @param body Transaksi Body
   * @returns Bentuk utuh transaksinya
   */
  decreaseFromAsset: (
    formData: TransactionFormData,
    body: TransactionBodyType
  ) => TransactionBodyType;
  /**
   * Tambah atau pindahkan ke tujuan aset tertentu. Digunakan untuk pemindahan aset
   * @param formData Form Data
   * @param body Transaksi Body
   * @returns Bentuk utuh transaksinya
   */
  increaseToAsset: (
    formData: TransactionFormData,
    body: TransactionBodyType
  ) => TransactionBodyType;
}

/** Interface untuk memproses data aset */
export interface AssetProcessProps {
  /**
   * Membuat data baru
   * @param formData Data yang akan diproses
   * @param userId ID usernya
   * @returns Data jadi
   */
  createNew: (
    formData: AssetFormValues,
    userId: string
  ) => Promise<BasicResponse<AssetsData>>;
  /**
   * Update data lama
   * @param formData Data yang akan diproses
   * @param userId ID usernya
   * @returns Data jadi
   */
  updateData: (
    formData: AssetFormValues,
    userId: string
  ) => Promise<BasicResponse<AssetsData>>;
  /**
   * Hapus data
   * @param formData Data yang akan dihapus
   * @param userId ID usernya
   * @returns Data jadi
   */
  deleteData: (
    assetName: string,
    clientId: string,
    deleteOption: DeleteOption
  ) => Promise<BasicResponse<null>>;
}

/**
 * Opsi untuk langkah selanjutnya yang akan dilakukan saat penghapusan aset
 * - delete-transaction : Hapus semua transaksi pada aset yang dipilih
 * - move-transaction : Pindahkan semua transaksi yang ada pada suatu aset
 */
export type DeleteOption = "delete-transaction" | "move-transaction";