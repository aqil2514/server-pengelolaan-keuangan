import { BasicResponse } from "./General";

export interface AssetsData {
  group: string;
  amount: number;
  description: string;
  name: string;
}

export interface AssetFormValues {
  oldAssetName: string;
  assetName: string;
  assetNominal: number;
  assetCategory: string;
  newAssetCategory?: string;
  assetDescription: string;
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

export interface AssetTransferData {
  decreaseFromAsset: (
    formData: TransactionFormData,
    body: TransactionBodyType
  ) => TransactionBodyType;
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
   * @returns Data jadi
   */
  createNew : (formData: AssetFormValues, userId:string) => Promise<BasicResponse<AssetsData>>;
}