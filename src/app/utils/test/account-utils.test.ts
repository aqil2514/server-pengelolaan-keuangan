import { describe, expect, jest, test } from "@jest/globals";
import { isValidEmail } from "../account-utils";
import { AccountUser } from "src/@types/Account";

//Lanjutin nanti kalo sempet

/** isValidEmail Function */
describe("[function] : isValidEmail", () => {
  test("Alamat emailnya valid", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  test("Alamat email tidak valid karena tidak ada @", () => {
    expect(isValidEmail("testexample.com")).toBe(false);
  });

  test("Alamat email tidak valid karena tidak ada domain", () => {
    expect(isValidEmail("test@.com")).toBe(false);
  });

  test("Alamat email tidak valid karena tidak ada namanya", () => {
    expect(isValidEmail("@example.com")).toBe(false);
  });

  test("Alamat email tidak valid karena tidak ada domain ujung (com, etc)", () => {
    expect(isValidEmail("test@example")).toBe(false);
  });

  test("Alamat email tidak valid karena belum diisi", () => {
    expect(isValidEmail("")).toBe(false);
  });
});
