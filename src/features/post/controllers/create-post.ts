import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { PostDocument } from '@post/interfaces/post.interface';
import { postSchema } from '@post/schemas/post.schemes';
import { PostCache } from '@service/redis/post.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

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

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId,
      createdPost,
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: 'Post created successfully' });
  }
}
