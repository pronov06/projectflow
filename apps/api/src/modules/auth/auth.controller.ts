import type { CookieOptions, Request, Response } from 'express';
import { CLIENT_PLATFORM_HEADER, type AuthResponse } from '@pms/shared';
import { env } from '../../config/env';
import { currentUserId } from '../../middleware/authenticate';
import { sendData } from '../../utils/http';
import * as authService from './auth.service';

export const REFRESH_COOKIE = 'pf_refresh';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  // Only sent to the auth endpoints that need it.
  path: '/api/auth',
};

/** Native apps keep tokens in secure device storage; browsers get an httpOnly cookie instead. */
const isNativeClient = (req: Request) => req.get(CLIENT_PLATFORM_HEADER) === 'mobile';

const clientContext = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent') });

function presentedRefreshToken(req: Request): string | undefined {
  const fromBody = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined;
  const fromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  return fromBody ?? fromCookie;
}

function sendSession(req: Request, res: Response, session: authService.Session, status: number) {
  const body: AuthResponse = { user: session.user, accessToken: session.accessToken };
  if (isNativeClient(req)) {
    body.refreshToken = session.refreshToken;
  } else {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...cookieOptions,
      expires: session.refreshTokenExpiresAt,
    });
  }
  return sendData(res, body, status);
}

export async function register(req: Request, res: Response) {
  const session = await authService.register(req.body, clientContext(req));
  sendSession(req, res, session, 201);
}

export async function login(req: Request, res: Response) {
  const session = await authService.login(req.body, clientContext(req));
  sendSession(req, res, session, 200);
}

export async function refresh(req: Request, res: Response) {
  try {
    const session = await authService.refresh(presentedRefreshToken(req), clientContext(req));
    sendSession(req, res, session, 200);
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logout(presentedRefreshToken(req), clientContext(req));
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  sendData(res, await authService.getMe(currentUserId(req)));
}
