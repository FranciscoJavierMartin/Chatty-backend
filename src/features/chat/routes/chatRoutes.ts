import express, { Router } from 'express';
import { authMiddleware } from '@global/middlewares/auth-middleware';
import { Add } from '@chat/controllers/tests/add-chat-message';
import { Get } from '@chat/controllers/tests/get-chat-message';

class ChatRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      '/chat/message/conversation-list',
      authMiddleware.checkAuthentication,
      Get.prototype.conversationList
    );

    this.router.get(
      '/chat/message/:receiverId',
      authMiddleware.checkAuthentication,
      Get.prototype.messages
    );

    this.router.post(
      '/chat/message',
      authMiddleware.checkAuthentication,
      Add.prototype.message
    );

    this.router.post(
      '/chat/message/add-chat-users',
      authMiddleware.checkAuthentication,
      Add.prototype.addChatUsers
    );

    this.router.delete(
      '/chat/message/remove-chat-users',
      authMiddleware.checkAuthentication,
      Add.prototype.removeChatUsers
    );

    return this.router;
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
