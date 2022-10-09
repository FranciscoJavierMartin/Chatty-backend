import { AuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.schema';
import { Helpers } from '@global/helpers/helpers';

class AuthService {
  public async getAuthUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<AuthDocument> {
    const query = {
      $or: [
        { username: Helpers.firstLetterUppercase(username) },
        { email: email.toLowerCase() },
      ],
    };

    return (await AuthModel.findOne(query).exec()) as AuthDocument;
  }

  public async getAuthUserByUsername(username: string): Promise<AuthDocument> {
    return (await AuthModel.findOne({
      username: Helpers.firstLetterUppercase(username),
    }).exec()) as AuthDocument;
  }

  public async getAuthUserByEmail(email: string): Promise<AuthDocument> {
    return (await AuthModel.findOne({
      email: email.toLowerCase(),
    }).exec()) as AuthDocument;
  }

  public async checkIfUserExists(
    username: string,
    email: string
  ): Promise<boolean> {
    const query = {
      $or: [
        { username: Helpers.firstLetterUppercase(username) },
        { email: email.toLowerCase() },
      ],
    };

    return !!(await AuthModel.exists(query).exec());
  }

  public async createAuthUser(data: AuthDocument): Promise<void> {
    await AuthModel.create(data);
  }

  public async updatePasswordToken(
    authId: string,
    token: string,
    tokenExpiration: number
  ): Promise<void> {
    await AuthModel.updateOne(
      {
        _id: authId,
      },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration,
      }
    );
  }
}

export const authService: AuthService = new AuthService();
