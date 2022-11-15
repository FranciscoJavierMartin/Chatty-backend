import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { UserCache } from '@service/redis/user.cache';
import { addChatSchema } from '@chat/schemes/chat';
import { UserDocument } from '@user/interfaces/user.interface';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { emailQueue } from '@service/queues/email.queue';
import {
  MessageData,
  MessageNotification,
} from '@chat/interfaces/chat.interface';
import { config } from '@root/config';
import { socketIOChatObject } from '@socket/chat';
import { NotificationTemplateParams } from '@notification/interfaces/notification.interface';
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template';
import { MessageCache } from '@service/redis/message.cache';
import { chatQueue } from '@service/queues/chat.queue';

const userCache: UserCache = new UserCache();
const messageCache: MessageCache = new MessageCache();

export class Add {
  @joiValidation(addChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    const {
      conversationId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      selectedImage,
      isRead,
    } = req.body;

    let fileUrl = '';

    const messageObjectId: ObjectId = new ObjectId();
    const conversationObjectId: ObjectId = !conversationId
      ? new ObjectId()
      : new mongoose.Types.ObjectId(conversationId);

    const sender: UserDocument = (await userCache.getUserFromCache(
      req.currentUser!.userId
    )) as UserDocument;

    if (selectedImage) {
      const result: UploadApiResponse = (await uploads(
        req.body.image,
        req.currentUser!.userId,
        true,
        true
      )) as UploadApiResponse;

      if (!result?.public_id) {
        throw new BadRequestError(result.message);
      }

      fileUrl = `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;
    }

    const messageData: MessageData = {
      _id: messageObjectId.toString(),
      conversationId: new mongoose.Types.ObjectId(conversationObjectId),
      receiverId,
      receiverAvatarColor,
      receiverProfilePicture,
      receiverUsername,
      senderUsername: req.currentUser!.username,
      senderId: req.currentUser!.userId,
      senderAvatarColor: req.currentUser!.avatarColor,
      senderProfilePicture: sender.profilePicture,
      body,
      isRead,
      gifUrl,
      selectedImage: fileUrl,
      reaction: [],
      createdAt: new Date(),
      deleteForEveryone: false,
      deleteForMe: false,
    };

    Add.prototype.emitSocketIOEvent(messageData);

    if (!isRead) {
      Add.prototype.messageNotification({
        currentUser: req.currentUser!,
        message: body,
        receiverId,
        receiverName: receiverUsername,
        messageData,
      });
    }

    await messageCache.addChatListToCache(
      req.currentUser!.userId,
      receiverId,
      conversationObjectId.toString()
    );
    await messageCache.addChatListToCache(
      receiverId,
      req.currentUser!.userId,
      conversationObjectId.toString()
    );
    await messageCache.addChatMessageToCache(
      conversationObjectId.toString(),
      messageData
    );

    chatQueue.addChatJob('addChatMessageToDB', messageData);

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Message added', conversationId: conversationObjectId });
  }

  public async addChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers = await messageCache.addChatUsersToCache(req.body);
    socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users added' });
  }

  public async removeChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers = await messageCache.removeChatUsersFromCache(req.body);
    socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users removed' });
  }

  public async reaction(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, reaction, type } = req.body;
    const updatedMessage: MessageData =
      await messageCache.updateMessageReaction(
        conversationId,
        messageId,
        reaction,
        req.currentUser!.username,
        type
      );

    socketIOChatObject.emit('message reaction', updatedMessage);

    chatQueue.addChatJob('updateMessageReaction', {
      messageId: new mongoose.Types.ObjectId(messageId),
      senderName: req.currentUser!.username,
      reaction,
      type,
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message reaction added' });
  }

  private emitSocketIOEvent(data: MessageData): void {
    socketIOChatObject.emit('message received', data);
    socketIOChatObject.emit('chat list', data);
  }

  private async messageNotification({
    currentUser,
    message,
    receiverName,
    receiverId,
  }: MessageNotification): Promise<void> {
    const cachedUser: UserDocument = (await userCache.getUserFromCache(
      receiverId
    )) as UserDocument;

    if (cachedUser.notifications.messages) {
      const templateParams: NotificationTemplateParams = {
        username: receiverName,
        message,
        header: `Message notification from ${currentUser.username}`,
      };
      const template: string =
        notificationTemplate.getNotificationTemplate(templateParams);
      emailQueue.addEmailJob('directMessageEmail', {
        receiverEmail: currentUser.email,
        template,
        subject: `You've received messages from ${receiverName}`,
      });
    }
  }
}
