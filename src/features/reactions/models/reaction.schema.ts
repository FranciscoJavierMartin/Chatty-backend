import { ReactionDocument } from '@reaction/interfaces/reaction.interface';
import mongoose, { model, Model, Schema } from 'mongoose';

const reactionSchema: Schema = new Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true },
  type: { type: String, default: '' },
  username: { type: String, default: '' },
  avataColor: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now() },
});

const ReactionModel: Model<ReactionDocument> = model<ReactionDocument>(
  'Reaction',
  reactionSchema,
  'Reaction'
);

export { ReactionModel };
