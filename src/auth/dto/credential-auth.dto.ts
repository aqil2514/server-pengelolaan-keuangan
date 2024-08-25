import { IsNotEmpty, MinLength } from 'class-validator';

export class CredentialAuthDto {
  @IsNotEmpty({ message: 'Username atau Email tidak boleh kosong' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;
}
