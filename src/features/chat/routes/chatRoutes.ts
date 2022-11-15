import express, { Router } from 'express';
import { authMiddleware } from '@global/middlewares/auth-middleware';
import { Add } from '@chat/controllers/add-chat-message';
import { Get } from '@chat/controllers/get-chat-message';
import { Delete } from '@chat/controllers/delete-chat-message';
import { Update } from '@chat/controllers/update-chat-message';

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

    this.router.patch(
      '/chat/message/mark-as-read',
      authMiddleware.checkAuthentication,
      Update.prototype.markMessageAsRead
    );

    this.router.patch(
      '/chat/message/reaction',
      authMiddleware.checkAuthentication,
      Add.prototype.reaction
    );

    this.router.delete(
      '/chat/message/remove-chat-users',
      authMiddleware.checkAuthentication,
      Add.prototype.removeChatUsers
    );

    this.router.delete(
      '/chat/message/mark-as-deleted',
      authMiddleware.checkAuthentication,
      Delete.prototype.markMessageAsDeleted
    );

    return this.router;
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
