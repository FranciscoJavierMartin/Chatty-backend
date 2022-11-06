import mongoose from 'mongoose';

export interface FileImageDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId | string;
  bgImageVersion: string;
  bgImageId: string;
  imgId: string;
  imgVersion: string;
  createdAt: Date;
}

export interface FileImageJobData {
  key?: string;
  value?: string;
  imgId?: string;
  imgVersion?: string;
  userId?: string;
  imageId?: string;
}

export interface BgUploadResponse {
  version: string;
  publicId: string;
  public_id?: string;
}
