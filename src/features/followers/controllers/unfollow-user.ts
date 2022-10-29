import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@service/redis/follower.cache';
import { UserDocument } from '@user/interfaces/user.interface';
import { FollowerData } from '@follower/interfaces/follower.interface';
import { followerQueue } from '@service/queues/follower.queue';

const followerCache: FollowerCache = new FollowerCache();

export class Remove {
  public async follower(req: Request, res: Response): Promise<void> {
    const { followerId, followeeId } = req.params;

    const removeFollowerFromCache: Promise<void> =
      followerCache.removeFollowerFromCache(
        `followers:${req.currentUser!.userId}`,
        followeeId
      );
    const removeFolloweeFromCache: Promise<void> =
      followerCache.removeFollowerFromCache(
        `following:${followeeId}`,
        followerId
      );

    const followersCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        followerId,
        'followersCount',
        -1
      );
    const followeesCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        followerId,
        'followingCount',
        -1
      );

    await Promise.all([
      removeFollowerFromCache,
      removeFolloweeFromCache,
      followersCount,
      followeesCount,
    ]);

    followerQueue.addFollowerJob('removeFollowerFromDB', {
      keyOne: followeeId,
      keyTwo: followerId,
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Unfollowed user' });
  }

  private userData(user: UserDocument): FollowerData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      username: user.username!,
      avatarColor: user.avatarColor!,
      postCount: user.postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      profilePicture: user.profilePicture,
      uId: user.uId!,
      userProfile: user,
    };
  }
}
