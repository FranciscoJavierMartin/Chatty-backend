import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HTTP_STATUS from 'http-status-codes';
import { ReactionDocument } from '@reaction/interfaces/reaction.interface';
import { reactionService } from '@service/db/reaction.service';
import { ReactionCache } from '@service/redis/reaction.cache';

const reactionCache: ReactionCache = new ReactionCache();

export class Get {
  public async reactions(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedReactions: [ReactionDocument[], number] =
      await reactionCache.getReactionsFromCache(postId);
    const reactions: [ReactionDocument[], number] = cachedReactions[0].length
      ? cachedReactions
      : await reactionService.getPostReactions(
          {
            postId: new mongoose.Types.ObjectId(postId),
          },
          {
            createdAt: -1,
          }
        );

    res.status(HTTP_STATUS.OK).json({
      message: 'Post reactions',
      reactions: reactions[0],
      count: reactions[1],
    });
  }

  public async singleReactionByUsername(
    req: Request,
    res: Response
  ): Promise<void> {
    const { postId, username } = req.params;
    const cachedReaction: [ReactionDocument, number] | [] =
      await reactionCache.getSingleReactionByUsernameFromCache(
        postId,
        username
      );
    const reactions: [ReactionDocument, number] | [] = cachedReaction.length
      ? cachedReaction
      : await reactionService.getSingleReactionByUsername(postId, username);

    res.status(HTTP_STATUS.OK).json({
      message: 'Single post reaction by username',
      reactions: reactions.length ? reactions[0] : {},
      count: reactions.length ? reactions[1] : 0,
    });
  }

  public async reactionsByUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const reactions: ReactionDocument[] =
      await reactionService.getReactionsByUsername(username);
    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'All reactions by username', reactions });
  }
}
