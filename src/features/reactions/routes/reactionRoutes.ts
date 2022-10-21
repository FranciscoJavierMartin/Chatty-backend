import express, { Router } from 'express';
import { authMiddleware } from '@global/middlewares/auth-middleware';
import { Add } from '@reaction/controllers/add-reactions';
import { Remove } from '@reaction/controllers/remove-reactions';

class ReactionRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post(
      '/post/reaction',
      authMiddleware.checkAuthentication,
      Add.prototype.reaction
    );

    this.router.delete(
      '/post/reaction/:postId/:previousReaction/:postReactions',
      authMiddleware.checkAuthentication,
      Remove.prototype.reaction
    );

    return this.router;
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
