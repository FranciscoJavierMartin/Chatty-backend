import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@service/redis/follower.cache';
import {
  Follower,
  FollowerData,
} from '@follower/interfaces/follower.interface';
import { followerService } from '@service/db/follower.service';

const followerCache: FollowerCache = new FollowerCache();

export class Get {
  public async userFollowing(req: Request, res: Response): Promise<void> {
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(
      req.currentUser!.userId
    );
    const cachedFollowers: FollowerData[] =
      await followerCache.getFollowersFromCache(
        `following:${req.currentUser!.userId}`
      );

    const following: Follower[] | FollowerData[] = cachedFollowers.length
      ? cachedFollowers
      : await followerService.getFolloweesData(userObjectId);

    res.status(HTTP_STATUS.OK).json({ message: 'User following', following });
  }
}
