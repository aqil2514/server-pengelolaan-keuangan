import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from './entities/user.entity';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    this.client = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Koneksi SUpabase Berhasil');
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async getUser(
    type: 'email' | 'username',
    credential: string,
  ): Promise<User> {
    try {
      const { data, error } = await this.client
        .from('user')
        .select()
        .eq(type, credential);

      if (error) {
        throw new Error(`Terjadi Kesalahan : ${error}`);
      }

      if (data.length === 0){
        throw new Error("User tidak ditemukan")
      }
      
      return data[0]
    } catch (error) {
        console.error(error);
        throw new Error("Terjadi kesalahan pada server")
    }
  }
}
