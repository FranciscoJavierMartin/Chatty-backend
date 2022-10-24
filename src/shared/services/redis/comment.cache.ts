import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { BaseCache } from '@service/redis/base.cache';

export class CommentCache extends BaseCache {
  constructor() {
    super('CommentCache');
  }

  public async savePostCommentToCache(
    postId: string,
    value: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.LPUSH(`comments:${postId}`, value);
      const commentsCount: string[] = await this.client.HMGET(
        `posts:${postId}`,
        'commentsCount'
      );
      let count = Helpers.parseJson(commentsCount[0]) as number;
      count++;
      const dataToSave: string[] = ['commentsCount', count.toString()];
      await this.client.HSET(`posts:${postId}`, dataToSave);
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
