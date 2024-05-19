  export interface TransactionBodyType {
    uid?: string;
    category: string;
    asset: string;
    item: string;
    price: number;
  }

  export interface TransactionType {
    header: string;
    body: TransactionBodyType[];
  }

  export interface ErrorsTransaction {
    type: string;
    total: string;
    date: string;
  }

  export interface TransactionFormData {
    uidTransaction: string;
    typeTransaction: 'Pemasukan' | 'Pengeluaran'; // Tipe transaksi harus salah satu dari kedua nilai ini
    totalTransaction: number | null; // Total transaksi, diasumsikan sebagai bilangan bulat
    dateTransaction: Date | null; // Tanggal transaksi, bisa null jika tidak disertakan
    categoryTransaction: string | null; // Kategori transaksi, diambil dari formulir
    assetsTransaction: string | null; // Aset transaksi, diambil dari formulir
    noteTransaction: string | null; // Catatan transaksi, diambil dari formulir
    price: number | null; // Harga atau jumlah transaksi, diambil dari formulir
  }