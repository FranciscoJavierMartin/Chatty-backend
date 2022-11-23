import express, { Router } from 'express';
import { authMiddleware } from '@global/middlewares/auth-middleware';
import { Get } from '@user/controllers/get-profile';
import { Search } from '@user/controllers/search-user';
import { Update } from '@user/controllers/change-password';
import { Edit } from '@user/controllers/update-basic-info';

class UserRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      '/user/all/:page',
      authMiddleware.checkAuthentication,
      Get.prototype.all
    );

    this.router.get(
      '/user/profile',
      authMiddleware.checkAuthentication,
      Get.prototype.profile
    );

    this.router.get(
      '/user/profile/:userId',
      authMiddleware.checkAuthentication,
      Get.prototype.profileByUserId
    );

    this.router.get(
      '/user/profile/posts/:username/:userId/:uId',
      authMiddleware.checkAuthentication,
      Get.prototype.profileByUserId
    );

    this.router.get(
      '/user/profile/user/suggestions',
      authMiddleware.checkAuthentication,
      Get.prototype.randomUserSuggestions
    );

    this.router.get(
      '/user/profile/search/:query',
      authMiddleware.checkAuthentication,
      Search.prototype.user
    );

    this.router.patch(
      '/user/profile/change-password',
      authMiddleware.checkAuthentication,
      Update.prototype.password
    );

    this.router.patch(
      '/user/profile/basic-info',
      authMiddleware.checkAuthentication,
      Edit.prototype.info
    );

    this.router.patch(
      '/user/profile/social-links',
      authMiddleware.checkAuthentication,
      Edit.prototype.socialLinks
    );

    return this.router;
  }
}

export const userRoutes: UserRoutes = new UserRoutes();
