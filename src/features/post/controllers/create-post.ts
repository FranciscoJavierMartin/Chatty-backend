import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { uploads, videoUpload } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { PostDocument } from '@post/interfaces/post.interface';
import {
  postSchema,
  postWithImageSchema,
  postWithVideoSchema,
} from '@post/schemas/post.schemes';
import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { socketIOPostObject } from '@socket/post';
import { imageQueue } from '@service/queues/image.queue';

const postCache: PostCache = new PostCache();

export class Create {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } =
      req.body;

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: PostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      createdAt: new Date(),
      reactions: {
        angry: 0,
        happy: 0,
        like: 0,
        love: 0,
        sad: 0,
        wow: 0,
      },
    } as PostDocument;

    socketIOPostObject.emit('add post', createdPost);

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId,
      createdPost,
    });

    postQueue.addPostJob('addPostToDB', {
      key: req.currentUser!.userId,
      value: createdPost,
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: 'Post created successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } =
      req.body;

    const result: UploadApiResponse = (await uploads(
      image
    )) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: PostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: {
        angry: 0,
        happy: 0,
        like: 0,
        love: 0,
        sad: 0,
        wow: 0,
      },
    } as PostDocument;

    socketIOPostObject.emit('add post', createdPost);

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId,
      createdPost,
    });

    postQueue.addPostJob('addPostToDB', {
      key: req.currentUser!.userId,
      value: createdPost,
    });

    imageQueue.addImageJob('addImageToDb', {
      key: req.currentUser!.userId,
      imgId: result.public_id,
      imgVersion: result.version.toString(),
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: 'Post with image created successfully' });
  }

  @joiValidation(postWithVideoSchema)
  public async postWithVideo(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, video } =
      req.body;

    const result: UploadApiResponse = (await videoUpload(
      video
    )) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: PostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      videoVersion: result.version.toString(),
      videoId: result.public_id,
      createdAt: new Date(),
      reactions: {
        angry: 0,
        happy: 0,
        like: 0,
        love: 0,
        sad: 0,
        wow: 0,
      },
    } as PostDocument;

    socketIOPostObject.emit('add post', createdPost);

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId,
      createdPost,
    });

    postQueue.addPostJob('addPostToDB', {
      key: req.currentUser!.userId,
      value: createdPost,
    });

    imageQueue.addImageJob('addImageToDb', {
      key: req.currentUser!.userId,
      imgId: result.public_id,
      imgVersion: result.version.toString(),
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: 'Post with image created successfully' });
  }
}
