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

  private workers: Worker[] = [];
  private currentIndex = 0;

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing 3 OCR workers...');

    this.workers = await Promise.all(
      Array.from({ length: 3 }, async () => {
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
          preserve_interword_spaces: '0',
        });
        return worker;
      }),
    );

    this.logger.log('3 OCR workers initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      this.workers.map(async (worker) => {
        await worker.terminate();
      }),
    );
    this.logger.log('All OCR workers terminated');
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.workers.length;
    return worker;
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

      const worker = this.getNextWorker();

      const {
        data: { text },
      } = await worker.recognize(processedBuffer);

      const result = text.replace(/\D/g, '');

      return result;
    } catch (error) {
      this.logger.error('OCR failed', error);

      throw new InternalServerErrorException('Không thể nhận diện CAPTCHA');
    }
  }
}
