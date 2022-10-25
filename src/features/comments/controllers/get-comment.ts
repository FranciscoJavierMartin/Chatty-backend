import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HTTP_STATUS from 'http-status-codes';
import {
  CommentDocument,
  CommentNameList,
} from '@comment/interfaces/comment.interface';
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

  public async commentsNamesFromCache(
    req: Request,
    res: Response
  ): Promise<void> {
    const { postId } = req.params;
    const cachedComments: CommentNameList[] =
      await commentCache.getCommentsNamesFromCache(postId);
    const commentsNames: CommentNameList[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostCommentNames(
          {
            postId: new mongoose.Types.ObjectId(postId),
          },
          { createdAt: -1 }
        );

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Post comments names', comments: commentsNames });
  }

  public async singleComment(req: Request, res: Response): Promise<void> {
    const { postId, commentId } = req.params;
    const cachedComments: CommentDocument[] =
      await commentCache.getSingleCommentFromCache(postId, commentId);
    const comments: CommentDocument[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostComments(
          {
            _id: new mongoose.Types.ObjectId(commentId),
          },
          { createdAt: -1 }
        );

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Single comment', comments: comments[0] });
  }
}
