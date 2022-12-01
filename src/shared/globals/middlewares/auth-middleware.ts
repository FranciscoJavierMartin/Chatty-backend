import { AuthPayload } from '@auth/interfaces/auth.interface';
import { UnauthorizedError } from '@global/helpers/error-handler';
import { config } from '@root/config';
import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';

export class AuthMiddleware {
  public verifyUser(req: Request, _res: Response, next: NextFunction): void {
    if (!req.session?.jwt) {
      throw new UnauthorizedError('Token is not available. Please login again');
    }

    try {
      const payload: AuthPayload = JWT.verify(
        req.session?.jwt,
        config.JWT_TOKEN
      ) as AuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new UnauthorizedError('Token is invalid. Please login again');
    }

    next();
  }

  public checkAuthentication(
    req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    if (!req.currentUser) {
      throw new UnauthorizedError('Authentication is required');
    }

    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
