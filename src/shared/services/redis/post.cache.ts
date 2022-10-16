import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import {
  PostDocument,
  Reactions,
  SavePostToCache,
} from '@post/interfaces/post.interface';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { BaseCache } from '@service/redis/base.cache';

export type PostCacheReturnedType =
  | string
  | number
  | Buffer
  | RedisCommandRawReply[]
  | PostDocument
  | PostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super('PostCache');
  }

  public async savePostToCache({
    key,
    currentUserId,
    uId,
    createdPost,
  }: SavePostToCache): Promise<void> {
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      reactions,
      createdAt,
    } = createdPost;

    const dataToSave: string[] = [
      '_id',
      `${_id}`,
      'userId',
      `${userId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'profilePicture',
      `${profilePicture}`,
      'post',
      `${post}`,
      'bgColor',
      `${bgColor}`,
      'feelings',
      `${feelings}`,
      'privacy',
      `${privacy}`,
      'gifUrl',
      `${gifUrl}`,
      'commentsCount',
      `${commentsCount}`,
      'reactions',
      JSON.stringify(reactions),
      'imgVersion',
      `${imgVersion}`,
      'imgId',
      `${imgId}`,
      'createdAt',
      `${createdAt}`,
    ];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postCount: string[] = await this.client.HMGET(
        `users:${currentUserId}`,
        'postsCount'
      );
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZADD('post', {
        score: parseInt(uId, 10),
        value: key.toString(),
      });
      multi.HSET(`posts:${key}`, dataToSave);
      const count: number = parseInt(postCount[0], 10) + 1;
      multi.HSET(`users:${currentUserId}`, ['postsCount', count]);
      multi.exec();
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getPostsFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<PostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheReturnedType = await multi.exec();
      const postReplies: PostDocument[] = [];

      for (const post of replies as unknown[] as PostDocument[]) {
        post.commentsCount = Helpers.parseJson(
          `${post.commentsCount}`
        ) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as Reactions;
        post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`));
        postReplies.push(post);
      }

      return postReplies;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getTotalPostsInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCARD('post');
      return count;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getPostsWithImageFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<PostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheReturnedType = await multi.exec();
      const postWithImages: PostDocument[] = [];

      for (const post of replies as unknown[] as PostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJson(
            `${post.commentsCount}`
          ) as number;
          post.reactions = Helpers.parseJson(`${post.reactions}`) as Reactions;
          post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`));
          postWithImages.push(post);
        }
      }

      return postWithImages;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getPostsByUserFromCache(
    key: string,
    uId: string
  ): Promise<PostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, uId, uId, {
        REV: true,
        BY: 'SCORE',
      });

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheReturnedType = await multi.exec();
      const postReplies: PostDocument[] = [];

      for (const post of replies as unknown[] as PostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJson(
            `${post.commentsCount}`
          ) as number;
          post.reactions = Helpers.parseJson(`${post.reactions}`) as Reactions;
          post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`));
          postReplies.push(post);
        }
      }

      return postReplies;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getTotalPostsByUserInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async deletePostFromCache(
    key: string,
    currentUserId: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postCount: string[] = await this.client.HMGET(
        `users:${currentUserId}`,
        'postsCount'
      );
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZREM('post', key);
      multi.DEL(`posts:${key}`);
      multi.DEL(`comments:${key}`);
      multi.DEL(`reactions:${key}`);
      const count: number = parseInt(postCount[0], 10) - 1;
      multi.HSET(`users:${currentUserId}`, ['postsCount', count]);
      await multi.exec();
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updatePostInCache(
    key: string,
    updatedPost: PostDocument
  ): Promise<PostDocument> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } = updatedPost;
    const dataToSave: string[] = [
      'post',
      `${post}`,
      'bgColor',
      `${bgColor}`,
      'feelings',
      `${feelings}`,
      'privacy',
      `${privacy}`,
      'gifUrl',
      `${gifUrl}`,
      'profilePicture',
      `${profilePicture}`,
      'imgVersion',
      `${imgVersion}`,
      'imgId',
      `${imgId}`,
    ];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.HSET(`posts:${key}`, dataToSave);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.HGETALL(`posts:${key}`);
      const reply: PostCacheReturnedType = await multi.exec();
      const postReply = reply as unknown as PostDocument[];
      postReply[0].commentsCount = Helpers.parseJson(
        postReply[0].commentsCount.toString()
      );
      postReply[0].reactions =
        Helpers.parseJson(postReply[0].reactions?.toString() || '') || {};
      postReply[0].createdAt = new Date(
        Helpers.parseJson(postReply[0].createdAt!.toString())
      );

      return postReply[0];
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
