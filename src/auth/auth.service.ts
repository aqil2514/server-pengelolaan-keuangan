import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { CredentialAuthDto } from './dto/credential-auth.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/supabase/entities/user.entity';
import { ValidationUtils } from './utils/auth-validation.utils';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly validationUtils: ValidationUtils,
    private readonly makeHttpRespons: MakeHttpRespons,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  /**
   * Login user dengan email atau username dan password.
   *
   * @param {CredentialAuthDto} credentialAuthDto - Data otentikasi yang berisi email/username dan password.
   * @returns {Promise<any>} - Mengembalikan data user tanpa password jika berhasil.
   * @throws {UnauthorizedException} - Jika password salah.
   */
  async login(credentialAuthDto: CredentialAuthDto): Promise<any> {
    this.logger.debug('Memulai Login...');
    const { email: credential, password } = credentialAuthDto;
    let user: User;

    // <<<<< Cek dulu yang diterima, apakah email atau username >>>>>
    this.logger.debug('Memulai pengecekan kredensial');
    const isEmail = this.validationUtils.isValidEmail(credential);
    const type = isEmail ? 'email' : 'username';

    this.logger.debug(
      `${type} terdeteksi sebagai kredensial. Memulai login dengan ${type}...`,
    );
    try {
      const findUser = await this.supabaseService.getUser(type, credential);

      user = findUser;
    } catch {
      this.logger.error('User tidak ditemukan');
      throw new NotFoundException('User tidak ditemukan');
    }

    // <<<<< Buat validasi untuk passwordnya >>>>>
    this.logger.debug('Mulai pengecekan password...');
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      this.logger.error('Login gagal : Password salah');
      throw new UnauthorizedException('Password salah');
    }
    this.logger.debug('Pengecekan password berhasil...');

    // <<<<< Kembalikan user data tanpa password >>>>>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userData } = user;

    this.logger.log(
      `Login berhasil! username: ${userData.username}, email: ${userData.email}`,
    );

    return this.makeHttpRespons.success('Login berhasil', userData);
  }

  async googleLogin(email: string) {
    const user = await this.supabaseService.getUser('email', email);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userData } = user;

    return userData;
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
