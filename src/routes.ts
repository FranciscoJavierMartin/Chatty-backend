import { Application } from 'express';
import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentRoutes';
import { commentRoutes } from '@comment/routes/commentRoutes';
import { followerRoutes } from '@follower/routes/followerRoutes';
import { authMiddleware } from '@global/middlewares/auth-middleware';
import { notificationRoutes } from '@notification/routes/notificationRoutes';
import { postRoutes } from '@post/routes/postRoutes';
import { reactionRoutes } from '@reaction/routes/reactionRoutes';
import { serverAdapter } from '@service/queues/base.queue';
import { imageRoutes } from '@image/routes/imageRoutes';
import { chatRoutes } from '@chat/routes/chatRoutes';

const BASE_PATH = '/api/v1';

export default function setupRoutes(app: Application) {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signOutRoute());

    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, chatRoutes.routes());
  };

  routes();
}
