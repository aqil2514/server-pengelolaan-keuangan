import { TransactionType } from "src/@types/Transaction";

export const getDecryptedTransactionData = (
    encryptedData: string,
    uid: string
  ): TransactionType[] => {
    let transactionData: TransactionType[] = [];
  
    if (encryptedData) {
      const data = JSON.parse(
        CryptoJS.AES.decrypt(String(encryptedData), uid).toString(
          CryptoJS.enc.Utf8
        )
      );
  
      transactionData = data;
    }
  
    return transactionData;
  };
  
  export function getSelectedTransactionBodyData(
    data: TransactionType[],
    idTransaction: string,
    uidTransaction: string
  ) {
    const selectedData = data.find((d) => d.id === idTransaction);
    if (!selectedData) throw new Error("Data yang akan diedit tidak ada");
  
    const selectedBodyData = selectedData.body.find(
      (d) => d.uid === uidTransaction
    );
  
    if(!selectedBodyData) throw new Error("Data tidak ditemukan")
  
    return selectedBodyData;
  }
  
  /**
   * Fungsi untuk mendekripsi dan mengurai data transaksi.
   *
   * @param transactionData - Data transaksi terenkripsi dalam bentuk string
   * @param key - Kunci yang digunakan untuk dekripsi
   * @returns Array dari objek TransactionType
   */
  export function getTransactionData(
    transactionData: string,
    key: string
  ): TransactionType[] {
    let result: TransactionType[] = [];
  
    // Mendekripsi data transaksi menggunakan dekripsi AES
    const decryptData = CryptoJS.AES.decrypt(transactionData, key).toString(
      CryptoJS.enc.Utf8
    );
  
    // Mengurai data yang telah didekripsi
    const parsedData = JSON.parse(decryptData);
  
    // Memeriksa apakah data yang diurai adalah array
    if (Array.isArray(parsedData)) {
      // Jika berupa array, set hasilnya ke array yang diurai
      result = parsedData;
    } else {
      // Jika bukan berupa array, masukkan objek yang diurai ke dalam array hasil
      result.push(parsedData);
    }
  
    // Mengembalikan array hasil
    return result;
  }
  