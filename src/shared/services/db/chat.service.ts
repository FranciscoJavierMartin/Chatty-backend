import { MessageData } from '@chat/interfaces/chat.interface';
import { ConversationDocument } from '@chat/interfaces/conversation.interface';
import { MessageModel } from '@chat/models/chat.schema';
import { ConversationModel } from '@chat/models/conversation.shema';
import { ObjectId } from 'mongodb';

class ChatService {
  public async addMessageToDB(data: MessageData): Promise<void> {
    const conversation: ConversationDocument[] = await ConversationModel.find({
      _id: data.conversationId,
    }).exec();

    if (!conversation.length) {
      await ConversationModel.create({
        _id: data.conversationId,
        senderId: data.senderId,
        receiverId: data.receiverId,
      });
    }

    await MessageModel.create({
      _id: data._id,
      conversationId: data.conversationId,
      receiverId: data.receiverId,
      receiverUsername: data.receiverUsername,
      receiverAvatarColor: data.receiverAvatarColor,
      receiverProfilePicture: data.receiverProfilePicture,
      senderUsername: data.senderUsername,
      senderId: data.senderId,
      senderAvatarColor: data.senderAvatarColor,
      senderProfilePicture: data.senderProfilePicture,
      body: data.body,
      isRead: data.isRead,
      gifUrl: data.gifUrl,
      selectedImage: data.selectedImage,
      reaction: data.reaction,
      createdAt: data.createdAt,
    });
  }

  public async getUserConversationList(
    userId: ObjectId
  ): Promise<MessageData[]> {
    const messages: MessageData[] = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: userId }, { $receiverId: userId }] } },
      {
        $group: {
          _id: '$conversationId',
          result: {
            $last: '$$ROOT',
          },
        },
      },
      {
        $project: {
          _id: '$result._id',
          conversationId: '$result.conversationId',
          receiverId: '$result.receiverId',
          receiverUsername: '$result.receiverUsername',
          receiverProfilePicture: '$result.receiverProfilePicture',
          receiverAvatarColor: '$result.receiverAvatarColor',
          senderId: '$result.senderId',
          senderUsername: '$result.senderUsername',
          senderAvatarColor: '$result.senderAvatarColor',
          senderProfilePicture: '$result.senderProfilePicture',
          body: '$result.body',
          isRead: '$result.isRead',
          gifUrl: '$result.gifUrl',
          selectedImage: '$result.selectedImage',
          reaction: '$result.reaction',
          createdAt: '$result.createdAt',
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    return messages;
  }

  public async getMessages(
    senderId: ObjectId,
    receiverId: ObjectId,
    sort: Record<string, 1 | -1>
  ): Promise<MessageData[]> {
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    };
    const messages: MessageData[] = await MessageModel.aggregate([
      { $match: query },
      { $sort: sort },
    ]);

    return messages;
  }

  public async markMessageAsDeleted(
    messageId: string,
    type: 'deleteForMe' | 'deleteForEveryone'
  ): Promise<void> {
    if (type === 'deleteForMe') {
      await MessageModel.updateOne(
        { _id: messageId },
        { $set: { deleteForMe: true } }
      ).exec();
    } else {
      await MessageModel.updateOne(
        { _id: messageId },
        { $set: { deleteForMe: true, deleteForEveryone: true } }
      ).exec();
    }
  }

  public async markMessageAsRead(
    senderId: ObjectId,
    receiverId: ObjectId
  ): Promise<void> {
    const query = {
      $or: [
        { senderId, receiverId, isRead: false },
        { senderId: receiverId, receiverId: senderId, isRead: false },
      ],
    };

    await MessageModel.updateMany(query, { $set: { isRead: true } }).exec();
  }

  public async updateMessageReaction(
    messageId: ObjectId,
    senderName: string,
    reaction: string,
    type: 'add' | 'remove'
  ): Promise<void> {
    if (type === 'add') {
      await MessageModel.findByIdAndUpdate(messageId, {
        $push: { reaction: { senderName, type: reaction } },
      }).exec();
    } else {
      await MessageModel.findByIdAndUpdate(messageId, {
        $pull: { reaction: { senderName } },
      }).exec();
    }
  }
}

export const chatService: ChatService = new ChatService();
