import { z } from 'zod';

/**
 * Memeriksa apakah string yang diberikan adalah email yang valid.
 *
 * @param {string} credential - String yang akan diperiksa.
 * @returns {boolean} - Mengembalikan `true` jika string adalah email yang valid, `false` jika tidak.
 */

export function isValidEmail(credential: string): boolean {
  const emailSchema = z.string().email();

  try {
    emailSchema.parse(credential);

    return true;
  } catch {
    return false;
  }
}
