import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { PostCache } from '@service/redis/post.cache';
import { postQueue } from '@service/queues/post.queue';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { postSchema } from '@post/schemas/post.schemes';
import { PostDocument } from '@post/interfaces/post.interface';
import { socketIOPostObject } from '@socket/post';

const postCache: PostCache = new PostCache();

export class Update {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
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
    } as PostDocument;

    await postCache.updatePostInCache(postId, updatedPost);

    socketIOPostObject.emit('update post', updatedPost, 'posts');

    postQueue.addPostJob('updatePostInDB', {
      key: postId,
      value: updatedPost,
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }
}
