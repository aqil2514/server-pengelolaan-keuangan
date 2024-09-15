import { Injectable, Logger } from '@nestjs/common';
import { dummyAccounts, dummyCategories } from './entity/dummy-data';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Injectable()
export class AssetsService {
  constructor(private readonly httpResponseService: MakeHttpRespons) {}

  private readonly logger = new Logger(AssetsService.name);

  async getAssets(uid: string) {
    const accounts = dummyAccounts;
    const categories = dummyCategories;

    return { accounts, categories};
  }
}
