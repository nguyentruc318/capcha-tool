import { PartialType } from '@nestjs/mapped-types';
import { CreateCapchaDto } from './create-capcha.dto';

export class UpdateCapchaDto extends PartialType(CreateCapchaDto) {}
