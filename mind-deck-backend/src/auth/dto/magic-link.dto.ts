import { IsEmail } from 'class-validator';

export class MagicLinkDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;
}