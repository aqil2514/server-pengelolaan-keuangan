import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Category } from 'src/assets/entity/category.entity';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class CategoryTransactionService {
  private readonly logger = new Logger(CategoryTransactionService.name);
  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(forwardRef(() => UtilsService))
    private readonly utilsService: UtilsService,
  ) {}

  async getCategories(userId: string): Promise<Category[]> {
    this.logger.log('Pengambilan data kategori transaksi user dimulai');
    const { category_transaction } =
      await this.supabaseService.getUserData(userId);

    this.logger.log(
      'Data kategori transaksi user berhasil diambil',
      'Memulai dekripsi data',
    );
    const categories = this.utilsService.decryptCategory(
      category_transaction,
      userId,
    );

    return categories;
  }
}
