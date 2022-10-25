import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { addCommentSchema } from '@comment/schemes/comment';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import {
  CommentDocument,
  CommentJob,
} from '@comment/interfaces/comment.interface';
import { CommentCache } from '@service/redis/comment.cache';
import { commentQueue } from '@service/queues/comment.queue';

const commentCache: CommentCache = new CommentCache();

export class Add {
  @joiValidation(addCommentSchema)
  public async comment(req: Request, res: Response): Promise<void> {
    const { userTo, postId, profilePicture, comment } = req.body;
    const commentObjectId: ObjectId = new ObjectId();

    const commentData: CommentDocument = {
      _id: commentObjectId,
      postId,
      username: req.currentUser!.username,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      comment,
      createdAt: new Date(),
    } as CommentDocument;

    await commentCache.savePostCommentToCache(
      postId,
      JSON.stringify(commentData)
    );

    const databaseCommentData: CommentJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      comment: commentData,
    };

    commentQueue.addCommentJob('addCommentToDB', databaseCommentData);

    res.status(HTTP_STATUS.OK).json({ message: 'Reaction added successfully' });
  }
}
