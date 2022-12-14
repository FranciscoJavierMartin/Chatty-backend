import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UploadApiResponse } from 'cloudinary';
import { PostCache } from '@service/redis/post.cache';
import { postQueue } from '@service/queues/post.queue';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import {
  postSchema,
  postWithImageSchema,
  postWithVideoSchema,
} from '@post/schemas/post.schemes';
import { PostDocument } from '@post/interfaces/post.interface';
import { socketIOPostObject } from '@socket/post';
import { uploads, videoUpload } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { imageQueue } from '@service/queues/image.queue';

const postCache: PostCache = new PostCache();

export class Update {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    await Update.prototype.updatePostWithImage(req);
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { imgVersion, imgId } = req.body;

    if (imgId && imgVersion) {
      await Update.prototype.updatePostWithImage(req);
    } else {
      await Update.prototype.addImageToExistingPost(req);
    }

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Post with image updated successfully' });
  }

  @joiValidation(postWithVideoSchema)
  public async postWithVideo(req: Request, res: Response): Promise<void> {
    const { videoId, videoVersion } = req.body;

    if (videoId && videoVersion) {
      await Update.prototype.updatePostWithImage(req);
    } else {
      await Update.prototype.addVideoToExistingPost(req);
    }

    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Post with image updated successfully' });
  }

  private async updatePostWithImage(req: Request): Promise<void> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      profilePicture,
      gifUrl,
      imgVersion,
      imgId,
      videoId,
      videoVersion,
    } = req.body;
    const { postId } = req.params;

    const updatedPost: PostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgVersion,
      imgId,
      videoId,
      videoVersion,
    } as PostDocument;

    const postUpdated = await postCache.updatePostInCache(postId, updatedPost);

    socketIOPostObject.emit('update post', postUpdated, 'posts');

    postQueue.addPostJob('updatePostInDB', {
      key: postId,
      value: postUpdated,
    });
  }

  private async addImageToExistingPost(
    req: Request
  ): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } =
      req.body;
    const { postId } = req.params;
    const result: UploadApiResponse = (await uploads(
      image
    )) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const updatedPost: PostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgVersion: result.public_id,
      imgId: result.version.toString(),
    } as PostDocument;

    await postCache.updatePostInCache(postId, updatedPost);

    socketIOPostObject.emit('update post', updatedPost, 'posts');

    postQueue.addPostJob('updatePostInDB', {
      key: postId,
      value: updatedPost,
    });

    if (image) {
      imageQueue.addImageJob('addImageToDb', {
        key: req.currentUser!.userId,
        imgId: result.public_id,
        imgVersion: result.version.toString(),
      });
    }

    return result;
  }

  private async addVideoToExistingPost(
    req: Request
  ): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, video } =
      req.body;
    const { postId } = req.params;
    const result: UploadApiResponse = (await videoUpload(
      video
    )) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const updatedPost: PostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      videoId: result.public_id,
      videoVersion: result.version.toString(),
    } as PostDocument;

    await postCache.updatePostInCache(postId, updatedPost);

    socketIOPostObject.emit('update post', updatedPost, 'posts');

    postQueue.addPostJob('updatePostInDB', {
      key: postId,
      value: updatedPost,
    });

    return result;
  }
}
