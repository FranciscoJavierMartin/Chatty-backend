import mongoose, { Document } from 'mongoose';

export interface NotificationDocument extends Document {
  _id?: mongoose.Types.ObjectId | string;
  userTo: string;
  userFrom: string;
  message: string;
  notificationType: string;
  entityId: mongoose.Types.ObjectId;
  createdItemId: mongoose.Types.ObjectId;
  comment: string;
  reaction: string;
  post: string;
  imgId: string;
  imgVersion: string;
  gifUrl: string;
  read?: boolean;
  createdAt?: Date;
  insertNotification(data: Notification): Promise<void>;
}

export interface Notification {
  userTo: string;
  userFrom: string;
  message: string;
  notificationType: string;
  entityId: mongoose.Types.ObjectId;
  createdItemId: mongoose.Types.ObjectId;
  createdAt: Date;
  comment: string;
  reaction: string;
  post: string;
  imgId: string;
  imgVersion: string;
  gifUrl: string;
}

export interface NotificationJobData {
  key?: string;
}

export interface NotificationTemplateParams {
  username: string;
  message: string;
  header: string;
}
