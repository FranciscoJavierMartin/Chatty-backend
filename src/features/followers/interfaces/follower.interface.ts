import { ObjectId } from 'mongodb';
import mongoose, { Document } from 'mongoose';
import { UserDocument } from '@user/interfaces/user.interface';

export interface Followers {
  userId: string;
}

export interface FollowerDocument extends Document {
  _id: mongoose.Types.ObjectId | string;
  followerId: mongoose.Types.ObjectId;
  followeeId: mongoose.Types.ObjectId;
  createdAt?: Date;
}

export interface Follower {
  _id: mongoose.Types.ObjectId | string;
  followeeId?: FollowerData;
  followerId?: FollowerData;
  createdAt?: Date;
}

export interface FollowerData {
  avatarColor: string;
  followersCount: number;
  followingCount: number;
  profilePicture: string;
  postCount: number;
  username: string;
  uId: string;
  _id?: mongoose.Types.ObjectId;
  userProfile?: UserDocument;
}

export interface FollowerJobData {
  keyOne?: string;
  keyTwo?: string;
  username?: string;
  followerDocumentId?: ObjectId;
}

export interface BlockedUserJobData {
  keyOne?: string;
  keyTwo?: string;
  type?: string;
}
