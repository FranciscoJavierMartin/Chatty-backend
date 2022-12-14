import {
  ChatList,
  ChatUsers,
  GetMessageFromCache,
  MessageData,
} from '@chat/interfaces/chat.interface';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { Reaction } from '@reaction/interfaces/reaction.interface';
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
        JSON.stringify(value)
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

  public async getChatMessagesFromCache(
    senderId: string,
    receiverId: string
  ): Promise<MessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList: string[] = await this.client.LRANGE(
        `chatList:${senderId}`,
        0,
        -1
      );
      const receiver: string = userChatList.find((userChat) =>
        userChat.includes(receiverId)
      )!;
      const parsedReceiver: ChatList = Helpers.parseJson(receiver);
      const chatMessages: MessageData[] = [];

      if (parsedReceiver) {
        const userMessages: string[] = await this.client.LRANGE(
          `messages:${parsedReceiver.conversationId}`,
          0,
          -1
        );

        for (const item of userMessages) {
          const chatItem = Helpers.parseJson(item);
          chatMessages.push(chatItem);
        }
      }

      return chatMessages;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async markMessageAsDeleted(
    senderId: string,
    receiverId: string,
    messageId: string,
    type: 'deleteForMe' | 'deleteForEveryone'
  ): Promise<MessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const { index, message, receiver } = await this.getMessage(
        senderId,
        receiverId,
        messageId
      );
      const chatItem: MessageData = Helpers.parseJson(message);

      if (type === 'deleteForMe') {
        chatItem.deleteForMe = true;
      } else {
        chatItem.deleteForMe = true;
        chatItem.deleteForEveryone = true;
      }

      await this.client.LSET(
        `messages:${receiver.conversationId}`,
        index,
        JSON.stringify(chatItem)
      );

      // Also "chatItem" can be returned
      const lastMessage: string = (await this.client.LINDEX(
        `messages:${receiver.conversationId}`,
        index
      ))!;
      return Helpers.parseJson(lastMessage);
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updateChatMessages(
    senderId: string,
    receiverId: string
  ): Promise<MessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList: string[] = await this.client.LRANGE(
        `chatList:${senderId}`,
        0,
        -1
      );
      const receiver: ChatList = Helpers.parseJson(
        userChatList.find((userChat) => userChat.includes(receiverId))!
      );
      const messages: string[] = await this.client.LRANGE(
        `messages:${receiver.conversationId}`,
        0,
        -1
      );
      const unreadMessages: string[] = messages.filter(
        (message) => !Helpers.parseJson(message).isRead
      );

      for (const item of unreadMessages) {
        const chatItem: MessageData = Helpers.parseJson(item);
        const index = messages.findIndex((message) =>
          message.includes(chatItem._id.toString())
        );
        chatItem.isRead = true;
        await this.client.LSET(
          `messages:${chatItem.conversationId}`,
          index,
          JSON.stringify(chatItem)
        );
      }

      const lastMessage: string = (await this.client.LINDEX(
        `messages:${receiver.conversationId}`,
        -1
      ))!;
      return Helpers.parseJson(lastMessage);
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updateMessageReaction(
    conversationId: string,
    messageId: string,
    reaction: string,
    senderName: string,
    type: 'add' | 'remove'
  ): Promise<MessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const messages: string[] = await this.client.LRANGE(
        `messages:${conversationId}`,
        0,
        -1
      );
      const messageIndex: number = messages.findIndex((message) =>
        message.includes(messageId)
      );
      const message: MessageData = Helpers.parseJson(
        (await this.client.LINDEX(`messages:${conversationId}`, messageIndex))!
      );

      if (message) {
        message.reaction = message.reaction.filter(
          (reaction) => reaction.senderName !== senderName
        );

        if (type === 'add') {
          message.reaction = [
            ...message.reaction,
            { senderName, type: reaction },
          ];
        }

        await this.client.LSET(
          `messages:${conversationId}`,
          messageIndex,
          JSON.stringify(message)
        );
      }

      const updatedMessage: string = (await this.client.LINDEX(
        `messages:${conversationId}`,
        messageIndex
      ))!;
      return Helpers.parseJson(updatedMessage);
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

  private async getMessage(
    senderId: string,
    receiverId: string,
    messageId: string
  ): Promise<GetMessageFromCache> {
    const userChatList: string[] = await this.client.LRANGE(
      `chatList:${senderId}`,
      0,
      -1
    );
    const receiver: ChatList = Helpers.parseJson(
      userChatList.find((item) => item.includes(receiverId))!
    );
    const messages: string[] = await this.client.LRANGE(
      `messages:${receiver.conversationId}`,
      0,
      -1
    );
    const index: number = messages.findIndex((message) =>
      message.includes(messageId)
    );

    return {
      index,
      message: messages[index],
      receiver,
    };
  }
}
