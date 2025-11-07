import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { SocialAccountService } from './social-account.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    SocialAccountService
  ],
  exports: [UserService, SocialAccountService]
})
export class UserModule {}
