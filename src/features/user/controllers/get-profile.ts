import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { FollowerData } from '@follower/interfaces/follower.interface';
import { followerService } from '@service/db/follower.service';
import { userService } from '@service/db/user.service';
import { FollowerCache } from '@service/redis/follower.cache';
import { PostCache } from '@service/redis/post.cache';
import { UserCache } from '@service/redis/user.cache';
import { AllUsers, UserDocument } from '@user/interfaces/user.interface';
import { Helpers } from '@global/helpers/helpers';
import { PostDocument } from '@post/interfaces/post.interface';
import { postService } from '@service/db/post.service';

interface UserAll {
  newSkip: number;
  limit: number;
  skip: number;
  userId: string;
}

type DataSource = 'redis' | 'mongodb';

const postCache: PostCache = new PostCache();
const userCache: UserCache = new UserCache();
const followerCache: FollowerCache = new FollowerCache();

const PAGE_SIZE = 12;

export class Get {
  public async all(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    const newSkip: number = skip === 0 ? skip : skip + 1;

    const allUsers = await Get.prototype.allUsers({
      newSkip,
      limit,
      skip,
      userId: req.currentUser!.userId,
    });
    const followers: FollowerData[] = await Get.prototype.followers(
      req.currentUser!.userId
    );

    res.status(HTTP_STATUS.OK).json({
      message: 'Get users',
      users: allUsers.users,
      totalUsers: allUsers.totalUsers,
      followers,
    });
  }

  public async profile(req: Request, res: Response): Promise<void> {
    const cachedUser: UserDocument | null = await userCache.getUserFromCache(
      req.currentUser!.userId
    );

    const existingUser: UserDocument = cachedUser
      ? cachedUser
      : await userService.getUserById(req.currentUser!.userId);

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Get user profile', user: existingUser });
  }

  public async profileByUserId(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const cachedUser: UserDocument | null = await userCache.getUserFromCache(
      userId
    );

    const existingUser: UserDocument = cachedUser
      ? cachedUser
      : await userService.getUserById(userId);

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Get user profile by id', user: existingUser });
  }

  public async profileAndPosts(req: Request, res: Response): Promise<void> {
    const { userId, username, uId } = req.params;

    const userName: string = Helpers.firstLetterUppercase(username);
    const cachedUser: UserDocument | null = await userCache.getUserFromCache(
      userId
    );
    const cachedUserPosts: PostDocument[] =
      await postCache.getPostsByUserFromCache('post', uId);

    const existingUser: UserDocument = cachedUser
      ? cachedUser
      : await userService.getUserById(userId);
    const userPosts: PostDocument[] = cachedUserPosts.length
      ? cachedUserPosts
      : await postService.getPosts({ username: userName }, 0, 100, {
          createdAt: -1,
        });

    res
      .status(HTTP_STATUS.OK)
      .json({
        message: 'Get user profile and posts',
        user: existingUser,
        posts: userPosts,
      });
  }

  private async allUsers({
    newSkip,
    limit,
    skip,
    userId,
  }: UserAll): Promise<AllUsers> {
    let users: UserDocument[];
    let type: DataSource;
    const cachedUsers: UserDocument[] = await userCache.getUsersFromCache(
      newSkip,
      limit,
      userId
    );

    if (cachedUsers.length) {
      type = 'redis';
      users = cachedUsers;
    } else {
      type = 'mongodb';
      users = await userService.getAllUsers(userId, skip, limit);
    }

    const totalUsers: number = await Get.prototype.usersCount(type);
    return { users, totalUsers };
  }

  private async usersCount(type: DataSource): Promise<number> {
    return type === 'redis'
      ? await userCache.getTotalUsersInCache()
      : await userService.getTotalUsersInDB();
  }

  private async followers(userId: string): Promise<FollowerData[]> {
    const cachedFollowers: FollowerData[] =
      await followerCache.getFollowersFromCache(`followers:${userId}`);
    const result = cachedFollowers.length
      ? cachedFollowers
      : await followerService.getFollowersData(
          new mongoose.Types.ObjectId(userId)
        );

    return result;
  }
}
