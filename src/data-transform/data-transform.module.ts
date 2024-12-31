import { Module } from '@nestjs/common';
import { DataTransformService } from './data-transform.service';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UtilsModule],
  providers: [DataTransformService],
  exports: [DataTransformService]
})
export class DataTransformModule {}
