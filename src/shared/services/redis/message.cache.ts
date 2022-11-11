import { ServerError } from '@global/helpers/error-handler';
import { BaseCache } from '@service/redis/base.cache';

export class MessageCache extends BaseCache {
  constructor() {
    super('MessageCache');
  }

  public async addChatListToCache(
    senderId: string,
    receiverId: string,
    conversationId: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const userChatList = await this.client.LRANGE(
        `chatList:${senderId}`,
        0,
        -1
      );

      if (!userChatList.length) {
        await this.client.RPUSH(
          `chatList:${senderId}`,
          JSON.stringify({ receiverId, conversationId })
        );
      } else {
        if (!userChatList.some((userChat) => userChat.includes(receiverId))) {
          await this.client.RPUSH(
            `chatList:${senderId}`,
            JSON.stringify({ receiverId, conversationId })
          );
        }
      }
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
