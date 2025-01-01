import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from './entities/user.entity';
import { UserData } from './entities/user-data.entity';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    this.client = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Koneksi Supabase Berhasil');
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async getUser(type: 'email' | 'username', credential: string): Promise<User> {
    this.logger.log("Mengambil informasi user...")
    try {
      const { data, error } = await this.client
        .from('user')
        .select()
        .eq(type, credential);

      if (error) {
        throw new Error(`Terjadi Kesalahan : ${error}`);
      }

      if (data.length === 0) {
        throw new Error('User tidak ditemukan');
      }

      this.logger.log(`User tersedia dengan username '${data[0].username}'`)

      return data[0];
    } catch (error) {
      console.error(error);
      throw new Error('Terjadi kesalahan pada server');
    }
  }

  async getUserByUid(userId: string): Promise<User> {
    try {
      const { data, error } = await this.client
        .from('user')
        .select()
        .eq("uid", userId);

      if (error) {
        throw new Error(`Terjadi Kesalahan : ${error}`);
      }

      if (data.length === 0) {
        throw new Error('User tidak ditemukan');
      }

      this.logger.log(`User tersedia dengan username '${data[0].username}'`)

      return data[0];
    } catch (error) {
      console.error(error);
      throw new Error('Terjadi kesalahan pada server');
    }
  }

  async getUserData(userId: string): Promise<UserData> {
    const user = await this.getUserByUid(userId)

    this.logger.log("Mengecek ID User...")
    
    try {
      const res = await this.client
        .from('user_data')
        .select()
        .eq('userId', user.uid);

      if (res.error) {
        throw new Error(`Terjadi Kesalahan : ${res.error}`);
      }

      this.logger.log("ID User ditemukan", "Mengambil data dari user terkait")

      if (res.data.length === 0) {
        this.logger.log("Data user belum dibuat.", "Membuat data baru");
        const newData = await this.client.from("user_data").insert([{userId: user.uid}]).select();
        this.logger.log("Data user berhasil dibuat", "Mengembalikan ke server")
        return newData.data[0]
      }

      return res.data[0];
    } catch (error) {
      this.logger.error(error);
      throw new Error('Terjadi kesalahan pada server');
    }
  }
}
