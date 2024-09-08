export interface Accounts{
    /** ID Akun */
    account_id: `acc-${string}`;
    /** Jumlah nominal uang yang ada di akun ini */
    amount: number;
    /** Jenis mata uang pada akun ini */
    currency: string;
    /** Sumber icon dari akun ini */
    icon: string | URL;
    /** Warna dari akun ini */
    color: `#${string}`;
    /** Deskripsi akun ini */
    description: string;
    /** Grup dari akun ini, misal: Tunai, E-Wallet, Bank */
    group: string;
    /** Akun ini dibuat */
    created_at: Date
}