import { ServerError } from '@global/helpers/error-handler';
import { SavePostToCache } from '@post/interfaces/post.interface';
import { BaseCache } from '@service/redis/base.cache';

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
}
