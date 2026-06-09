import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import sharp from 'sharp';
import { createWorker, Worker } from 'tesseract.js';

@Injectable()
export class CapchaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CapchaService.name);

  private worker!: Worker;

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing OCR worker...');

    this.worker = await createWorker('eng');

    await this.worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      preserve_interword_spaces: '0',
    });

    this.logger.log('OCR worker initialized');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.logger.log('OCR worker terminated');
    }
  }

  async giaiCaptchaSo(base64Image: string): Promise<string> {
    try {
      const imageBuffer = Buffer.from(base64Image, 'base64');

      const processedBuffer = await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .linear(1.5, -0.2)
        .threshold(120)
        .sharpen()
        .toBuffer();

      const {
        data: { text },
      } = await this.worker.recognize(processedBuffer);

      const result = text.replace(/\D/g, '');

      return result;
    } catch (error) {
      this.logger.error('OCR failed', error);

      throw new InternalServerErrorException('Không thể nhận diện CAPTCHA');
    }
  }
}
