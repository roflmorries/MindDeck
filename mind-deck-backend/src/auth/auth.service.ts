import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthDto } from './dto/auth.dto';
import { AuthProvider } from '@prisma/client';

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OAuthUserData {
  providerId: string;
  provider: AuthProvider;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private userService: UserService
  ) {}

  

}
