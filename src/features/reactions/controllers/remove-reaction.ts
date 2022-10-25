import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { ReactionJob } from '@reaction/interfaces/reaction.interface';
import { removeReactionSchema } from '@reaction/schemes/reactions';
import { ReactionCache } from '@service/redis/reaction.cache';
import { reactionQueue } from '@service/queues/reaction.queue';

const reactionCache: ReactionCache = new ReactionCache();

export class Remove {
  @joiValidation(removeReactionSchema)
  public async reaction(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction, postReactions } = req.params;

    await reactionCache.removePostReactionFromCache(
      postId,
      `${req.currentUser!.username}`,
      JSON.parse(postReactions)
    );
    const databaseReactionData: ReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction,
    };
    reactionQueue.addReactionJob('removeReactionFromDB', databaseReactionData);
    res.status(HTTP_STATUS.OK).json({ message: 'Removed reaction from post' });
  }
}
