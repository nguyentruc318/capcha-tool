import { Module } from '@nestjs/common';
import { CapchaService } from './capcha.service';
import { CaptchaController } from './capcha.controller';

@Module({
  controllers: [CaptchaController],
  providers: [CapchaService],
})
export class CapchaModule {}
