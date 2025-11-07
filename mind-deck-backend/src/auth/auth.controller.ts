import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService, OAuthUserData } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';
import type { Response } from 'express';
import { Public } from './decorators/public.decorator';
import { TokenUtils } from './utils/token.utils';
import { AuthGuard } from '@nestjs/passport';
import { MagicLinkDto } from './dto/magic-link.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // @UsePipes(new ValidationPipe())
  // @HttpCode(200)
  // @Post('login')
  // async login(@Body() dto: AuthDto) {
  //   return this.authService.login(dto)
  // }


  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string; user: any }> {
    const tokens = await this.authService.register(dto);

    TokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      message: 'Registration successful',
      user: {
        accessToken: tokens.accessToken
      }
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: AuthDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string; user: any }> {
    const tokens = await this.authService.login(dto);

    TokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      message: 'Login successful',
      user: {
        accessToken: tokens.accessToken
      }
    }
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: OAuthUserData },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.googleAuth(req.user);

    TokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);

    // Редиректим на фронтенд с access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/success?token=${tokens.accessToken}`);
  }

  // @Public()
  // @Post('magic-link')
  // @HttpCode(HttpStatus.OK)
  // async sendMagicLink(@Body() dto: MagicLinkDto): Promise<{ message: string }> {
  //   return this.authService.sendMagicLink(dto);
  // }

  // // 🔗 GET /api/auth/verify/:token - Подтвердить magic link
  // @Public()
  // @Get('verify/:token')
  // async verifyMagicLink(
  //   @Param('token') token: string, // Извлекаем token из URL
  //   @Res({ passthrough: true }) res: Response,
  // ): Promise<{ message: string; user: any }> {
  //   const tokens = await this.authService.verifyMagicLink(token);

  //   this.setRefreshTokenCookie(res, tokens.refreshToken);

  //   return {
  //     message: 'Email verified successfully',
  //     user: {
  //       accessToken: tokens.accessToken,
  //     },
  //   };
  // }

  // 🔄 POST /api/auth/refresh - Обновить токены
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  async refreshTokens(
    @Req() req: Request & { user: any },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { refreshToken, tokenId } = req.user;

    await this.authService.deleteRefreshTokenById(tokenId);

    const user = await this.authService.getUserById(req.user.id);
    const tokens = await this.authService.generateTokensForUser(user);

    TokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken
    }
  }

  // 🚪 POST /api/auth/logout - Выход
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) // Требует авторизации
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId: string, // Получаем ID текущего пользователя
  ): Promise<{ message: string }> {
    const refreshToken = TokenUtils.getRefreshTokenFromCookie(req);

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Удаляем cookie
    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  // @Public()
  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards()

}

