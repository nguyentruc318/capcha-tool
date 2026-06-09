import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CapchaModule } from './capcha/capcha.module';

@Module({
  imports: [CapchaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
