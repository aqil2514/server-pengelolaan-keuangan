import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AssetsService } from './assets.service';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Controller('/api/assets')
export class AssetsController {
    constructor(
        private readonly assetsService:AssetsService,
        private readonly httpResponseService:MakeHttpRespons
    ){}
    @Get("getAssets")
    async getAssets(@Req() req:Request, @Res() res:Response){
        const uid = req.query.uid as string;

        const accounts = await this.assetsService.getAssets(uid);
        const data = this.httpResponseService.success<typeof accounts>("Aset dan kategori berhasil diambil", accounts, 200);

        return res.json(data);
    }
}
