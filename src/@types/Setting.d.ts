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

type Security = Omit<CD_SettingSecurity, "password" | "securityOption">

export interface CD_SettingSecurityCore extends Security {
  securityQuiz: string;
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}