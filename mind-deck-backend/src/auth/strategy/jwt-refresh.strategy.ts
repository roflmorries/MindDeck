import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from 'passport-jwt'
import { UserService } from "../../user/user.service";
import { Request } from "express";
import { JwtPayload } from "./jwt.strategy";


@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: JwtPayload) {

    const refreshToken = req.body?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Regresh token not found')
    }
    
    const user = this.authService;

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    return user;
  }
}