import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-custom'
import { UserService } from "../../user/user.service";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma.service";

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  // role: string;
  iat: number;
  exp: number;
}


@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private config: ConfigService,
    private userService: UserService,
    private jwt: JwtService,
    private prisma: PrismaService
  ) {
    super()
  }

  async validate(req: Request): Promise<any> {

    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found')
    }

    let payload: JwtRefreshPayload;
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET')
      })
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token signature')
    }


    const user = await this.userService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const isTokenValid = await this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: user.id,
        expiresAt: {gt: new Date()},
      },
    });

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      refreshToken,
      tokenId: isTokenValid.id
    };
  }
}