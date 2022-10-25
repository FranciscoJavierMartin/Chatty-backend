import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HTTP_STATUS from 'http-status-codes';
import { CommentDocument } from '@comment/interfaces/comment.interface';
import { CommentCache } from '@service/redis/comment.cache';
import { commentService } from '@service/db/comment.service';

const commentCache: CommentCache = new CommentCache();

export class Get {
  public async comment(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedComments: CommentDocument[] =
      await commentCache.getCommentsFromCache(postId);
    const comments: CommentDocument[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostComments(
          {
            postId: new mongoose.Types.ObjectId(postId),
          },
          { createdAt: -1 }
        );

    res.status(HTTP_STATUS.OK).json({ message: 'Post comments', comments });
  }
}
