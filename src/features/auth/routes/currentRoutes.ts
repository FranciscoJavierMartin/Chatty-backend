import { CurrentUser } from '@auth/controllers/current-user';
import { authMiddleware } from '@global/middlewares/auth-middleware';
import { Router } from 'express';

class CurrentUserRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  public routes(): Router {
    this.router.get(
      '/currentuser',
      authMiddleware.checkAuthentication,
      CurrentUser.prototype.read
    );
    return this.router;
  }
}

export const currentUserRoutes: CurrentUserRoutes = new CurrentUserRoutes();
