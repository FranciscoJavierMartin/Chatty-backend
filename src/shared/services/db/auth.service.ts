import { AuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.schema';
import { Helpers } from '@global/helpers/helpers';

class AuthService {
  public async getUserByUsernameOrEmail(
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

  public async getUserByUsername(username: string): Promise<AuthDocument> {
    return (await AuthModel.findOne({
      username: Helpers.firstLetterUppercase(username),
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
}

export const authService: AuthService = new AuthService();
