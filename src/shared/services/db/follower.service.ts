import mongoose, { Query } from 'mongoose';
import { ObjectId, BulkWriteResult } from 'mongodb';
import { UserModel } from '@user/models/user.schema';
import {
  FollowerData,
  FollowerDocument,
} from '@follower/interfaces/follower.interface';
import { FollowerModel } from '@follower/models/follower.schema';
import { QueryComplete, QueryDeleted } from '@post/interfaces/post.interface';
import { UserDocument } from '@user/interfaces/user.interface';
import { socketIONotificationObject } from '@socket/notification';
import {
  NotificationDocument,
  NotificationTemplateParams,
} from '@notification/interfaces/notification.interface';
import { NotificationModel } from '@notification/models/notification.schema';
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';

const userCache: UserCache = new UserCache();

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

    const response: UserDocument[] = (await Promise.all([
      users,
      userCache.getUserFromCache(followeeId),
    ])) as UserDocument[];

    if (response[1].notifications.follows && userId !== followeeId) {
      const notificationModel: NotificationDocument = new NotificationModel();

      const notifications = await notificationModel.insertNotification({
        userFrom: userId,
        userTo: followeeId,
        message: `${username} is now following you`,
        notificationType: 'follows',
        entityId: new mongoose.Types.ObjectId(userId),
        createdItemId: new mongoose.Types.ObjectId(following._id!),
        createdAt: new Date(),
        comment: '',
        post: '',
        imgId: '',
        imgVersion: '',
        gifUrl: '',
        reaction: '',
      });

      socketIONotificationObject.emit('insert notification', notifications, {
        userTo: followeeId,
      });

      const templateParams: NotificationTemplateParams = {
        username: response[1].username!,
        message: `${username} is now following you`,
        header: 'Follower notification',
      };

      const template: string =
        notificationTemplate.getNotificationTemplate(templateParams);
      emailQueue.addEmailJob('followersEmail', {
        receiverEmail: response[1].email!,
        template,
        subject: `${username} is now following you`,
      });
    }
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
