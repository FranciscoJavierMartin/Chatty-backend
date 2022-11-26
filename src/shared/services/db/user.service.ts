import mongoose from 'mongoose';
import {
  BasicInfo,
  NotificationSettings,
  SearchUser,
  SocialLinks,
  UserDocument,
} from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { followerService } from './follower.service';
import { AuthModel } from '@auth/models/auth.schema';

class UserService {
  public async addUserData(data: UserDocument): Promise<void> {
    await UserModel.create(data);
  }

  public async getUserById(userId: string): Promise<UserDocument> {
    const users: UserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'Auth',
          localField: 'authId',
          foreignField: '_id',
          as: 'authId',
        },
      },
      {
        $unwind: '$authId',
      },
      {
        $project: this.aggregateProject(),
      },
    ]);

    return users[0];
  }

  public async getUserByAuthId(authId: string): Promise<UserDocument> {
    const users: UserDocument[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      {
        $lookup: {
          from: 'Auth',
          localField: 'authId',
          foreignField: '_id',
          as: 'authId',
        },
      },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() },
    ]);

    return users[0];
  }

  public async getAllUsers(
    userId: string,
    skip: number,
    limit: number
  ): Promise<UserDocument[]> {
    const users: UserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'Auth',
          localField: 'authId',
          foreignField: '_id',
          as: 'authId',
        },
      },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() },
    ]);

    return users;
  }

  public async getRandomUsers(userId: string): Promise<UserDocument[]> {
    const randomUsers: UserDocument[] = [];

    const users: UserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      {
        $lookup: {
          from: 'Auth',
          localField: 'authId',
          foreignField: '_id',
          as: 'authId',
        },
      },
      { $unwind: '$authId' },
      { $sample: { size: 10 } },
      {
        $addFields: {
          username: '$authId.username',
          email: '$authId.email',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          createdAt: '$authId.createdAt',
        },
      },
      {
        $project: {
          authId: 0,
          __v: 0,
        },
      },
    ]);

    const followers: string[] = await followerService.getFolloweesIds(userId);

    for (const user of users) {
      const followerIndex = followers.findIndex(
        (id) => id === user._id.toString()
      );

      if (followerIndex === -1) {
        randomUsers.push(user);
      }
    }

    return randomUsers;
  }

  public async getTotalUsersInDB(): Promise<number> {
    return await UserModel.find({}).countDocuments();
  }

  public async searchUsers(regex: RegExp): Promise<SearchUser[]> {
    const users = await AuthModel.aggregate([
      { $match: { username: regex } },
      {
        $lookup: {
          from: 'User',
          localField: '_id',
          foreignField: 'authId',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          username: 1,
          email: 1,
          avatarColor: 1,
          profilePicture: 1,
        },
      },
    ]);

    return users;
  }

  public async updatePassword(
    username: string,
    hashedPassword: string
  ): Promise<void> {
    await AuthModel.updateOne(
      { username },
      {
        $set: { password: hashedPassword },
      }
    ).exec();
  }

  public async updateUserInfo(userId: string, info: BasicInfo): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        work: info.work,
        school: info.school,
        quote: info.quote,
        location: info.location,
      },
    }).exec();
  }

  public async updateSocialLinks(
    userId: string,
    links: SocialLinks
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        social: links,
      },
    }).exec();
  }

  public async updateNotificationSettings(
    userId: string,
    settings: NotificationSettings
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        notifications: settings,
      },
    }).exec();
  }

  private aggregateProject() {
    return {
      _id: 1,
      username: '$authId.username',
      uId: '$authId.uId',
      email: '$authId.email',
      avatarColor: '$authId.avatarColor',
      createdAt: '$authId.createdAt',
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1,
    };
  }
}

export const userService: UserService = new UserService();
