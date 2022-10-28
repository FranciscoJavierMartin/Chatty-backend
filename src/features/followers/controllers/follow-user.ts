import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@service/redis/follower.cache';
import { UserCache } from '@service/redis/user.cache';
import { UserDocument } from '@user/interfaces/user.interface';
import { FollowerData } from '@follower/interfaces/follower.interface';
import { socketIOFollowerObject } from '@socket/follower';

const followerCache: FollowerCache = new FollowerCache();
const userCache: UserCache = new UserCache();

export class Add {
  public async follower(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;

    const followersCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        followerId,
        'followersCount',
        1
      );
    const followeesCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        req.currentUser!.userId,
        'followingCount',
        1
      );

    await Promise.all([followersCount, followeesCount]);

    const cachedFollowee: Promise<UserDocument> = userCache.getUserFromCache(
      followerId
    ) as Promise<UserDocument>;
    const cachedFollower: Promise<UserDocument> = userCache.getUserFromCache(
      req.currentUser!.userId
    ) as Promise<UserDocument>;

    const response: [UserDocument, UserDocument] = await Promise.all([
      cachedFollowee,
      cachedFollower,
    ]);

    const followerObjectId: ObjectId = new ObjectId();
    const addFolloweeData: FollowerData = Add.prototype.userData(response[0]);

    socketIOFollowerObject.emit('add follower', addFolloweeData);

    const addFollowerToCache: Promise<void> = followerCache.saveFollowerToCache(
      `followers:${req.currentUser!.userId}`,
      followerId
    );
    const addFolloweeToCache: Promise<void> = followerCache.saveFollowerToCache(
      `following:${followerId}`,
      req.currentUser!.userId
    );
    await Promise.all([addFollowerToCache, addFolloweeToCache]);

    res.status(HTTP_STATUS.OK).json({ message: 'Following user now' });
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
