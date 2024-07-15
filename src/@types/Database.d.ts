import {
  AccountConfig,
  AccountData,
  AccountDB,
  AccountPrivacy,
  AccountStatusFlags,
} from "./Account";

export interface Database {
  public: {
    Tables: {
      user: {
        Row: AccountDB;
        Insert: {
          uid: never;
          config: AccountConfig;
          privacy: AccountPrivacy;
          statusFlags: AccountStatusFlags;
        };
        Update: {
          uid: never;
          config: AccountConfig;
          privacy: AccountPrivacy;
          statusFlags: AccountStatusFlags;
        };
      };
      user_data: {
        Row: AccountData;
        Insert: {
          userId: never;
          createdAt: Date;
          user_transaction: string;
          user_assets: string;
        };
        Update: {
          userId: never;
          createdAt: Date;
          user_transaction: string;
          user_assets: string;
        };
      };
    };
  };
}
