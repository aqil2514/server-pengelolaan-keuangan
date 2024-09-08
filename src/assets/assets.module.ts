import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Module({
    controllers: [AssetsController],
    providers:[AssetsService, MakeHttpRespons],
    exports:[AssetsService]
})
export class AssetsModule {}
