import { BasicResponse } from "./General";

export interface Account {
  username: string;
  email: string;
  password: string;
}

export interface AccountStatusFlags {
  isVerified: boolean;
  isHavePassword: boolean;
  isHaveSecurityQuiz: boolean;
}

export type AccountUser = Omit<AccountDB, "password">;

export interface AccountConfig {
  currency: CurrencyType;
  language: LanguageType;
  purposeUsage: PurposeUsageType;
}

export interface AccountPrivacy {
  securityQuiz: string;
  securityAnswer: string;
}

export interface AccountData {
  userId: string;
  createdAt?: string;
  user_transaction?: string;
  user_assets?: string;
}

export interface AccountDB extends Account {
  uid?: string;
  config: AccountConfig;
  privacy: AccountPrivacy;
  statusFlags: AccountStatusFlags;
}

export interface AccountRegister extends Account {
  confirmPassword: string;
  securityQuiz: string;
  securityAnswer: string;
  currency: CurrencyType;
  language: LanguageType;
  purposeUsage: PurposeUsageType;
}

export interface AccountResponse {
  success: boolean;
  message: string | null;
  notifMessage?: string;
  path: string;
}

export interface AccountProfile extends Account {
  uid: AccountDB["uid"];
  currency: AccountDB["config"]["currency"];
  language: AccountDB["config"]["language"];
  purposeUsage: AccountDB["config"]["purposeUsage"];
}

export interface AccountSecurityProps {
  OldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  securityQuiz: string;
  securityAnswer: string;
}

export interface NewSecurityProps {
  securityOption: "password-option" | "security-question-option";
  user: AccountUser;
  securityData: Omit<AccountSecurityProps, "OldPassword">;
}

export type CurrencyType = "IDR" | "USD" | "EUR";

export type LanguageType = "ID" | "EN";

export type PurposeUsageType = "Individu" | "Organization";

/**
 * Function untuk update keamanan user
 */
export interface AccountSecurityUpdateFunctions {
  /**
   * Membuat password baru
   * @param password Password
   * @param confirmPassword Konfirmasi password
   * @param userId User ID
   * @returns Basic HTTP Response
   */
  newPassword: (
    password: string,
    confirmPassword: string,
    user: AccountDB
  ) => Promise<BasicResponse>;
  /**
   * Membuat pertanyaan keamanan baru
   * @param question Apa pertanyaan yang diinginkan?
   * @param answer Apa jawabannya?
   * @param user User yang mana?
   * @returns
   */
  newSecurityUpdate: (
    question: string,
    answer: string,
    user: AccountDB,
    action: "update" | "create-new"
  ) => Promise<BasicResponse>;
  updatePassword: (
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string,
    user: AccountDB
  ) => Promise<BasicResponse>;
}

export interface ValidationFunction {
  validatePassword: (password: string) => string | null;
  validateNewPassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): string | null;
}
