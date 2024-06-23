/**
 * Client Data Setting Security
 *
 * Interface yang mengambil tipe data yang dikirim oleh Client
 */
export interface CD_SettingSecurity {
  uid: string;
  securityAnswer: string;
  password: string;
  securityOption: "password-option" | "security-question-option";
}
