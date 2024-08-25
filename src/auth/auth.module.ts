import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { ValidationUtils } from './utils/auth-validation.utils';
import { MakeHttpRespons } from 'src/shared/httpResponse.utils';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService, ValidationUtils, MakeHttpRespons],
  exports: [ValidationUtils]
})
export class AuthModule {}
