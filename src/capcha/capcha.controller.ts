import { Controller, Post, Body } from '@nestjs/common';
import { CapchaService } from './capcha.service';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CapchaService) {}

  @Post('solve')
  async solve(@Body() body: { image: string }) {
    const code = await this.captchaService.giaiCaptchaSo(body.image);
    return { success: true, code };
  }
}
