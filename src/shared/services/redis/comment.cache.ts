import {
  CommentDocument,
  CommentNameList,
} from '@comment/interfaces/comment.interface';
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

  public async getCommentsFromCache(
    postId: string
  ): Promise<CommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const list: CommentDocument[] = [];

      for (const item of reply) {
        list.push(Helpers.parseJson(item));
      }

      return list;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getCommentsNamesFromCache(
    postId: string
  ): Promise<CommentNameList[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const commentsCount: number = await this.client.LLEN(
        `comments:${postId}`
      );
      const comments: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const list: string[] = [];

      for (const item of comments) {
        const comment: CommentDocument = Helpers.parseJson(item);
        list.push(comment.username);
      }

      return [
        {
          count: commentsCount,
          names: list,
        },
      ];
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
