import mongoose, { model, Model, Schema } from 'mongoose';
import { CommentDocument } from '@comment/interfaces/comment.interface';

const commentSchema: Schema = new Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true },
  comment: { type: String, default: '' },
  username: { type: String },
  avataColor: { type: String },
  profilePicture: { type: String },
  createdAt: { type: Date, default: Date.now() },
});

const CommentsModel: Model<CommentDocument> = model<CommentDocument>(
  'Comment',
  commentSchema,
  'Comment'
);

export { CommentsModel };
