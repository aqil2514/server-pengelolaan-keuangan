import { Injectable, Logger } from '@nestjs/common';
import { dummyAccounts, dummyCategories } from './entity/dummy-data';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Injectable()
export class AssetsService {
  constructor(private readonly httpResponseService: MakeHttpRespons) {}

  private readonly logger = new Logger(AssetsService.name);

  async getAssets(uid: string) {
    this.logger.log(`Mengambil data untuk user dengan UID ${uid}`);
    const accounts = dummyAccounts;
    const categories = dummyCategories

    return { accounts, categories };
  }
}
