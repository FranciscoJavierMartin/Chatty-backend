import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
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

      if (previousReaction) {
        this.removePostReactionFromCache(key, reaction.username, postReactions);
      }

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

  public async removePostReactionFromCache(
    key: string,
    username: string,
    postReactions: Reactions
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string[] = await this.client.LRANGE(
        `reactions:${key}`,
        0,
        -1
      );
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userPreviousReaction: ReactionDocument = this.getPreviousReaction(
        response,
        username
      );
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exec();

      const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
      await this.client.HSET(`posts:${key}`, dataToSave);
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  private getPreviousReaction(
    response: string[],
    username: string
  ): ReactionDocument {
    const list: ReactionDocument[] = [];

    for (const item of response) {
      list.push(Helpers.parseJson(item) as ReactionDocument);
    }

    return list.find((item) => item.username === username)!;
  }
}
