import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export interface ReactionDocument extends Document {
  _id?: string | ObjectId;
  username: string;
  avataColor: string;
  type: string;
  postId: string;
  profilePicture: string;
  createdAt?: Date;
  userTo?: string | ObjectId;
  comment?: string;
}

export interface Reactions {
  like: number;
  love: number;
  happy: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface ReactionJob {
  postId: string;
  username: string;
  previousReaction: string;
  userTo?: string;
  userFrom?: string;
  type?: string;
  reactionObject?: ReactionDocument;
}

export interface QueryReaction {
  _id?: string | ObjectId;
  postId?: string | ObjectId;
}

export interface Reaction {
  senderName: string;
  type: string;
}
