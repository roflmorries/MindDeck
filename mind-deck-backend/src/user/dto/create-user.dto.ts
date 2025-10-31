import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserDto {

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  passwordHash?: string

  @IsOptional()
  @IsString()
  avatar?: string

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean
}
