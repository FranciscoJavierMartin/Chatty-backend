import { PostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { UpdateQuery } from 'mongoose';

class PostService {
  public async addPostToDB(
    userId: string,
    createdPost: PostDocument
  ): Promise<void> {
    const post: Promise<PostDocument> = PostModel.create(createdPost);
    const user: UpdateQuery<UserDocument> = UserModel.updateOne(
      {
        _id: userId,
      },
      {
        $inc: { postsCount: 1 },
      }
    );

    await Promise.all([post, user]);
  }
}

export const postService: PostService = new PostService();
