import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { BaseCache } from '@service/redis/base.cache';
import {
  NotificationSettings,
  SocialLinks,
  UserDocument,
} from '@user/interfaces/user.interface';

type UserItem = string | SocialLinks | NotificationSettings;

export class UserCache extends BaseCache {
  constructor() {
    super('UserCache');
  }

  public async saveUserToCache(
    key: string,
    userId: string,
    createdUser: UserDocument
  ): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social,
    } = createdUser;
    const dataToSave: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`,
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social),
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`,
    ];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.ZADD('user', {
        score: parseInt(userId, 10),
        value: `${key}`,
      });
      await this.client.HSET(`users:${key}`, dataToSave);
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUserFromCache(key: string): Promise<UserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: UserDocument = (await this.client.HGETALL(
        `users:${key}`
      )) as unknown as UserDocument;

      response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
      response.postsCount = Helpers.parseJson(`${response.postsCount}`);
      response.blocked = Helpers.parseJson(`${response.blocked}`);
      response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
      response.notifications = Helpers.parseJson(`${response.notifications}`);
      response.social = Helpers.parseJson(`${response.social}`);
      response.followersCount = Helpers.parseJson(`${response.followersCount}`);
      response.followingCount = Helpers.parseJson(`${response.followingCount}`);
      response.bgImageId = Helpers.parseJson(`${response.bgImageId}`);
      response.bgImageVersion = Helpers.parseJson(`${response.bgImageVersion}`);
      response.profilePicture = Helpers.parseJson(`${response.profilePicture}`);

      return response;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUsersFromCache(
    start: number,
    end: number,
    excludedUserKey: string
  ): Promise<UserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string[] = await this.client.ZRANGE('user', start, end, {
        REV: true,
      });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      for (const key of response) {
        if (key !== excludedUserKey) {
          multi.HGETALL(`users:${key}`);
        }
      }
      const replies = await multi.exec();
      const userReplies: UserDocument[] = [];

      for (const reply of replies as unknown as UserDocument[]) {
        reply.createdAt = new Date(Helpers.parseJson(`${reply.createdAt}`));
        reply.postsCount = Helpers.parseJson(`${reply.postsCount}`);
        reply.blocked = Helpers.parseJson(`${reply.blocked}`);
        reply.blockedBy = Helpers.parseJson(`${reply.blockedBy}`);
        reply.notifications = Helpers.parseJson(`${reply.notifications}`);
        reply.social = Helpers.parseJson(`${reply.social}`);
        reply.followersCount = Helpers.parseJson(`${reply.followersCount}`);
        reply.followingCount = Helpers.parseJson(`${reply.followingCount}`);
        reply.bgImageId = Helpers.parseJson(`${reply.bgImageId}`);
        reply.bgImageVersion = Helpers.parseJson(`${reply.bgImageVersion}`);
        reply.profilePicture = Helpers.parseJson(`${reply.profilePicture}`);

        userReplies.push(reply);
      }

      return userReplies;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updateSingleUserItemInCache(
    userId: string,
    prop: string,
    value: UserItem
  ): Promise<UserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const dataToSave: string[] = [`${prop}`, JSON.stringify(value)];
      await this.client.HSET(`users:${userId}`, dataToSave);
      const response: UserDocument = (await this.getUserFromCache(
        userId
      )) as UserDocument;
      return response;
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
