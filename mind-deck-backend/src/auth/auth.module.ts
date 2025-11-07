import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
// import { GoogleStrategy } from './strategy/google.strategy';

import { UserModule } from '../user/user.module';
import { PrismaService } from '../prisma.service';
import { getJwtConfig } from '../config/jwt.config';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig
    }),
  ],
  
  controllers: [AuthController],
  
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
    JwtRefreshStrategy,
    // GoogleStrategy,
  ],
  
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
  ],
})
export class AuthModule {}