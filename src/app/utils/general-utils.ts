import { AccountDB, AccountData, AccountUser } from "../../@types/Account";
import supabase from "../lib/db";

export async function getUser(id: string) {
  const res = await supabase.from("user").select("*").eq("uid", id);
  if (!res.data || res.data?.length === 0) return null;

  const proc: AccountDB = res.data[0];

  const user: AccountUser = {
    uid: proc.uid,
    username: proc.username,
    privacy: proc.privacy,
    email: proc.email,
    config: proc.config,
  };

  return user;
}

export async function getUserData(id: string) {
  const res = await supabase.from("user_data").select("*").eq("userId", id);
  if (!res.data || res.data?.length === 0) return null;

  const proc: AccountData = res.data[0];

  return proc;
}
