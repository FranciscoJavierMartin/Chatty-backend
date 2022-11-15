import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { MessageCache } from '@service/redis/message.cache';
import { MessageData } from '@chat/interfaces/chat.interface';
import { socketIOChatObject } from '@socket/chat';
import { chatQueue } from '@service/queues/chat.queue';

const messageCache: MessageCache = new MessageCache();

export class Delete {
  public async markMessageAsDelete(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.body;
    const updatedMessage: MessageData = await messageCache.markMessageAsDeleted(
      senderId,
      receiverId,
      messageId,
      type
    );

    socketIOChatObject.emit('message read', updatedMessage);
    socketIOChatObject.emit('chat list', updatedMessage);

    chatQueue.addChatJob('markMessageAsDeleted', {
      messageId: new mongoose.Types.ObjectId(messageId),
      type,
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as deleted' });
  }
}
