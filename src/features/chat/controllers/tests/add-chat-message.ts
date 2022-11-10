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
import { MessageData } from '@chat/interfaces/chat.interface';
import { config } from '@root/config';

const userCache: UserCache = new UserCache();

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
  }
}
