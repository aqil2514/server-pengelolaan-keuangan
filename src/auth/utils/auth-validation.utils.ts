import { Injectable } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ValidationUtils {
  /**
   * Memeriksa apakah string yang diberikan adalah email yang valid.
   *
   * @param {string} credential - String yang akan diperiksa.
   * @returns {boolean} - Mengembalikan `true` jika string adalah email yang valid, `false` jika tidak.
   */
  isValidEmail(credential: string): boolean {
    const emailSchema = z.string().email();

    try {
      emailSchema.parse(credential);
      return true;
    } catch {
      return false;
    }
  }
}
