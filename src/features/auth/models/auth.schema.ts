import { hash, compare } from 'bcryptjs';
import { model, Model, Schema } from 'mongoose';
import { AuthDocument } from '../interfaces/auth.interface';

const SALT_ROUND = 10;

const authSchema = new Schema(
  {
    username: { type: String },
    uId: { type: String },
    email: { type: String },
    password: { type: String },
    avatarColor: { type: String },
    createdAt: { type: Date, default: Date.now },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Number },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

authSchema.pre('save', async function (this: AuthDocument, next: () => void) {
  const hashedPassword: string = await hash(this.password!, SALT_ROUND);
  this.password = hashedPassword;
  next();
});

authSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  const hashedPassword: string = (this as unknown as AuthDocument).password!;
  return compare(password, hashedPassword);
};

authSchema.methods.hashPassword = async function (
  password: string
): Promise<string> {
  return hash(password, SALT_ROUND);
};

const AuthModel: Model<AuthDocument> = model<AuthDocument>(
  'Auth',
  authSchema,
  'Auth'
);

export { AuthModel };
