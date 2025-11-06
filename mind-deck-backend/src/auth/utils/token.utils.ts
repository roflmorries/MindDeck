import { Response } from 'express';

export class TokenUtils {
  /**
   * @param res - Express Response object
   * @param refreshToken - JWT refresh token
   */
  static setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * @param res - Express Response object
   */
  static clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  /**
   * @param req - Express Request object
   * @returns refresh token or null
   */
  static getRefreshTokenFromCookie(req: any): string | null {
    return req.cookies?.refreshToken || null;
  }

  /**
   * @param req - Express Request object
   * @returns access token or null
   */
  static getAccessTokenFromHeader(req: any): string | null {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.replace('Bearer ', '').trim();
  }
}