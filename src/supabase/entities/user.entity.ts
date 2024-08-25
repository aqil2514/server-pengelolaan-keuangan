export interface UserConfig {
  currency: 'IDR' | 'USD';
  language: 'ID' | 'EN';
  purposeUsage: 'Individu' | 'Kelompok';
}

export interface UserPrivacy{
    securityQuiz: string;
    secuirityAnswer: string;
}

export interface UserStatusFlags{
    isHavePassword: boolean;
    isVerified: boolean;
    isHaveSecurityQuiz: boolean;
}

export class User {
  uid: string;
  username: string;
  password: string;
  email: string;
  config: UserConfig;
  privacy: UserPrivacy;
}
