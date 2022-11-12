import {
  ChatList,
  ChatUsers,
  MessageData,
} from '@chat/interfaces/chat.interface';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
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

  public async addChatMessageToCache(
    conversationId: string,
    value: MessageData
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.RPUSH(
        `messages:${conversationId}`,
        JSON.stringify({ value })
      );
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async addChatUsersToCache(value: ChatUsers): Promise<ChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const chatUsersStrigified: string = JSON.stringify(value);
      const users: ChatUsers[] = await this.getChatUsersList();
      let chatUsers: ChatUsers[] = [];

      if (
        !users.some(
          (chatUser) => JSON.stringify(chatUser) === chatUsersStrigified
        )
      ) {
        await this.client.RPUSH('chatUsers', chatUsersStrigified);
        chatUsers = await this.getChatUsersList();
      } else {
        chatUsers = users;
      }

      return chatUsers;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async removeChatUsersFromCache(
    value: ChatUsers
  ): Promise<ChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const chatUsersStrigified: string = JSON.stringify(value);
      const users: ChatUsers[] = await this.getChatUsersList();
      let chatUsers: ChatUsers[] = [];
      const usersIndex: number = users.findIndex(
        (chatUser) => JSON.stringify(chatUser) === chatUsersStrigified
      );

      if (usersIndex > -1) {
        await this.client.LREM('chatUsers', usersIndex, chatUsersStrigified);
        chatUsers = await this.getChatUsersList();
      } else {
        chatUsers = users;
      }

      return chatUsers;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUserConversationList(key: string): Promise<MessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const userChatlist: string[] = await this.client.LRANGE(
        `chatList:${key}`,
        0,
        -1
      );
      const conversationChatList: MessageData[] = [];

      for (const item of userChatlist) {
        const chatItem: ChatList = Helpers.parseJson(item);
        const lastMessage: string = (await this.client.LINDEX(
          `messages:${chatItem.conversationId}`,
          -1
        ))!;
        conversationChatList.push(Helpers.parseJson(lastMessage));
      }

      return conversationChatList;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  private async getChatUsersList(): Promise<ChatUsers[]> {
    const chatUsersList: ChatUsers[] = [];
    const chatUsers = await this.client.LRANGE('chatUsers', 0, -1);

    for (const item of chatUsers) {
      const chatUsers: ChatUsers = Helpers.parseJson(item);
      chatUsersList.push(chatUsers);
    }

    return chatUsersList;
  }
}
