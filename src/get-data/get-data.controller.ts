import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { GetDataQuery } from './entity/get-data.entity';
import { GetDataService } from './get-data.service';
import { Request, Response } from 'express';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Controller('/api/get-data')
export class GetDataController {
  constructor(
    private readonly httpResponseService: MakeHttpRespons,
    private readonly getDataService: GetDataService,
  ) {}

  private readonly logger = new Logger(GetDataController.name);

  @Get(':query')
  async getData(
    @Param('query') query: GetDataQuery,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const id = req.query.id as string;
    const validQuery: GetDataQuery[] = ['all', 'asset', 'transaction'];
    if (!query) {
      throw new BadRequestException(`Parameter diperlukan`);
    }

    if (!validQuery.includes(query)) {
      throw new BadRequestException('Query tidak valid');
    }

    const data = await this.getDataService.getData(query, id);

    const response = this.httpResponseService.success<typeof data>(
      'Data berhasil diambil',
      data,
      200,
    );

    return res.json(response);
  }
}
