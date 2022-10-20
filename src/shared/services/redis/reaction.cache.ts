import { ServerError } from '@global/helpers/error-handler';
import { Reactions } from '@post/interfaces/post.interface';
import { ReactionDocument } from '@reaction/interfaces/reaction.interface';
import { BaseCache } from '@service/redis/base.cache';

export class ReactionCache extends BaseCache {
  constructor() {
    super('ReactionCache');
  }

  public async savePostReactionToCache(
    key: string,
    reaction: ReactionDocument,
    postReactions: Reactions,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // if (previousReaction) {
      // }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        const dataToSave: string[] = [
          'reactions',
          JSON.stringify(postReactions),
        ];
        await this.client.HSET(`posts:${key}`, dataToSave);
      }
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
