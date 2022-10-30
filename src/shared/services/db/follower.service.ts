import mongoose, { Query } from 'mongoose';
import { ObjectId, BulkWriteResult } from 'mongodb';
import { UserModel } from '@user/models/user.schema';
import {
  FollowerData,
  FollowerDocument,
} from '@follower/interfaces/follower.interface';
import { FollowerModel } from '@follower/models/follower.schema';
import { QueryComplete, QueryDeleted } from '@post/interfaces/post.interface';

class FollowerService {
  public async addFollowerToDB(
    userId: string,
    followeeId: string,
    username: string,
    followerDocumentId: ObjectId
  ): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(userId);

    const following = await FollowerModel.create({
      _id: followerDocumentId,
      followeeId: followeeObjectId,
      followerId: followerObjectId,
    });

    // FIXME: Circular dependency
    // const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
    //   {
    //     updateOne: {
    //       filter: { _id: userId },
    //       update: { $inc: { followingCount: 1 } },
    //     },
    //   },
    //   {
    //     updateOne: {
    //       filter: { _id: followeeId },
    //       update: { $inc: { followersCount: 1 } },
    //     },
    //   },
    // ]);

    const users = [
      UserModel.findByIdAndUpdate(userId, {
        $inc: {
          followingCount: 1,
        },
      }),
      UserModel.findByIdAndUpdate(followeeId, {
        $inc: {
          followersCount: 1,
        },
      }),
    ];

    await Promise.all([users, UserModel.findOne({ _id: followeeId })]);
  }

  public async removeFollowerFromDB(
    followeeId: string,
    followerId: string
  ): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(followerId);

    const unfollow: Query<QueryComplete & QueryDeleted, FollowerDocument> =
      FollowerModel.deleteOne({
        followeeId: followeeObjectId,
        followerId: followerObjectId,
      });

    // FIXME: Circular dependency
    // const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
    //   {
    //     updateOne: {
    //       filter: { _id: followerObjectId },
    //       update: { $inc: { followingCount: -1 } },
    //     },
    //   },
    //   {
    //     updateOne: {
    //       filter: { _id: followeeId },
    //       update: { $inc: { followersCount: -1 } },
    //     },
    //   },
    // ]);

    const users = [
      UserModel.findByIdAndUpdate(followerObjectId, {
        $inc: {
          followingCount: -1,
        },
      }),
      UserModel.findByIdAndUpdate(followeeId, {
        $inc: {
          followersCount: -1,
        },
      }),
    ];

    await Promise.all([unfollow, users]);
  }

  public async getFolloweesData(
    userObjectId: ObjectId
  ): Promise<FollowerData[]> {
    const followees: FollowerData[] = await FollowerModel.aggregate([
      { $match: { followerId: userObjectId } },
      {
        $lookup: {
          from: 'User',
          localField: 'followeeId',
          foreignField: '_id',
          as: 'followeeId',
        },
      },
      { $unwind: '$followeeId' },
      {
        $lookup: {
          from: 'Auth',
          localField: 'followeeId.authId',
          foreignField: '_id',
          as: 'authId',
        },
      },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followeeId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          postCount: '$authId.postCount',
          followersCount: '$authId.followersCount',
          followingCount: '$authId.followingCount',
          profilePicture: '$authId.profilePicture',
          userProfile: '$followeeId',
        },
      },
      {
        $project: {
          authId: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0,
        },
      },
    ]);

    return followees;
  }

  public async getFollowersData(
    userObjectId: ObjectId
  ): Promise<FollowerData[]> {
    const followers: FollowerData[] = await FollowerModel.aggregate([
      { $match: { followeeId: userObjectId } },
      {
        $lookup: {
          from: 'User',
          localField: 'followeeId',
          foreignField: '_id',
          as: 'followeeId',
        },
      },
      { $unwind: '$followeeId' },
      {
        $lookup: {
          from: 'Auth',
          localField: 'followeeId.authId',
          foreignField: '_id',
          as: 'authId',
        },
      },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followeeId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          postCount: '$authId.postCount',
          followersCount: '$authId.followersCount',
          followingCount: '$authId.followingCount',
          profilePicture: '$authId.profilePicture',
          userProfile: '$followeeId',
        },
      },
      {
        $project: {
          authId: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0,
        },
      },
    ]);

    return followers;
  }
}

export const followerService: FollowerService = new FollowerService();
