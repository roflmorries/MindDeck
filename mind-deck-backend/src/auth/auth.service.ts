import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthDto } from './dto/auth.dto';
import { AuthProvider, RefreshToken, User } from '@prisma/client';
import { SocialAccountService } from '../user/social-account.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OAuthUserData {
  providerId: string;
  provider: AuthProvider;
  email: string;
  name?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwt: JwtService,
    private userService: UserService,
    private socialAccountService: SocialAccountService,
  ) { }

  async register(dto: RegisterDto): Promise<JwtTokens> {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userService.create({
      email: dto.email,
      name: dto.name,
      passwordHash
    })

    return this.generateTokens(user)
  };

  async login(dto: AuthDto): Promise<JwtTokens> {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.passwordHash) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null
    }

    return user;
  }

  async googleAuth(userData: OAuthUserData): Promise<JwtTokens> {
    let user = await this.userService.findByEmail(userData.email);

    if (!user) {
      user = await this.userService.create({
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        isEmailVerified: true
      })
    }

    await this.socialAccountService.upsertSocialAccount({
      provider: userData.provider,
      providerId: userData.providerId,
      userId: user.id
    })

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    })

    return { message: 'Logged out successfully' }
  }

  private async deleteRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({ where: { id } })
  }

  private async deleteRefreshTokenByValue(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token }
    })
  }

  async deleteRefreshTokenById(tokenId: string): Promise<void> {
    await this.deleteRefreshToken(tokenId);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async generateTokensForUser(user: User): Promise<JwtTokens> {
    return this.generateTokens(user);
  }

  private async createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  private async generateTokens(user: User): Promise<JwtTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt
    })

    return { accessToken, refreshToken }
  }

}
