export interface Category {
    /** ID unik untuk kategori */
    category_id: `trc-${string}`;
    /** Nama kategori */
    name: string;
    /** Deskripsi singkat mengenai kategori */
    description?: string;
    /** Warna atau kode warna untuk kategori ini */
    color: `#${string}`;
    /** Icon yang terkait dengan kategori ini */
    icon?: {
      type:  "default-icon" | "url" | "upload",
      name: string
  };
    /** Tanggal kapan kategori ini dibuat */
    created_at: string;
  }
  