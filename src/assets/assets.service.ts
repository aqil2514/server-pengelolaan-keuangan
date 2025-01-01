import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UtilsService } from 'src/utils/utils.service';
import { Accounts } from './entity/account.entity';

@Injectable()
export class AssetsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(forwardRef(() => UtilsService))
    private readonly utilsService: UtilsService,
  ) {}

  private readonly logger = new Logger(AssetsService.name);

  async getAssets(userId: string): Promise<Accounts[]> {
    this.logger.log("Pengambilan data Aset user dimulai")
    const { user_assets } = await this.supabaseService.getUserData(userId);

    this.logger.log("Data aset user berhasil dimulai",'Dekripsi dimulai');
    const assets = this.utilsService.decryptAssets(user_assets, userId);

    return assets;
  }
}
