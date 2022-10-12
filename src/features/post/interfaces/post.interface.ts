import { ObjectId } from 'mongodb';
import mongoose, { Document } from 'mongoose';

interface Reactions {
  like: number;
  lover: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface PostDocument extends Document {
  _id?: string | mongoose.Types.ObjectId;
  userId: string;
  username: string;
  email: string;
  avatarColor: string;
  profilePicture: string;
  post: string;
  bgColor: string;
  commentsCount: number;
  imgVersion?: string;
  imgId?: string;
  feelings?: string;
  gifUrl?: string;
  privacy?: string;
  reactions?: Reactions;
  createdAt?: Date;
}

export interface GetPostsQuery {
  _id?: ObjectId | string;
  username?: string;
  imgId?: string;
  gifUrl?: string;
}

export interface SavePostToCache {
  key: ObjectId | string;
  currentUserId: string;
  uId: string;
  createdPost: PostDocument;
}

export interface PostJobData {
  key?: string;
  value?: PostDocument;
  keyOne?: string;
  keyTwo?: string;
}

export interface QueryComplete {
  ok?: number;
  n?: number;
}

export interface QueryDeleted {
  deletedCount?: number;
}
