import { ConversationDocument } from '@chat/interfaces/conversation.interface';
import mongoose, { model, Model, Schema } from 'mongoose';

const conversationSchema: Schema = new Schema({
  senderId: { type: mongoose.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Types.ObjectId, ref: 'User' },
});

const ConversationModel: Model<ConversationDocument> =
  model<ConversationDocument>('Conversation', conversationSchema);
export { ConversationModel };
