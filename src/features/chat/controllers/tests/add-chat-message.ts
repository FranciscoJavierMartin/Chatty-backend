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

      // TODO: cloudinary url
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

    // TODO: Add sender to chat list in cache
    // TODO: Add receiver to chat list in cache
    // TODO: Add message data to cache
    // TODO: Add message to chat queue

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

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Message added', conversationId: conversationObjectId });
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
