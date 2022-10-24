import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export interface CommentDocument extends Document {
  _id?: string | ObjectId;
  username: string;
  avatarColor: string;
  postId: string;
  profilePicture: string;
  comment: string;
  createdAt?: Date;
  userTo?: string | ObjectId;
}

export interface CommentJob {
  postId: string;
  userTo: string;
  userFrom: string;
  username: string;
  comment: CommentDocument;
}

export interface CommentNameList {
  count: number;
  names: string[];
}

export interface QueryComment {
  _id?: string | ObjectId;
  postId?: string | ObjectId;
}

export interface QuerySort {
  createdAt?: number;
}
