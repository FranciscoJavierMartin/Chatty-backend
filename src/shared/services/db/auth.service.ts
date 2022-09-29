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
}

export const authService: AuthService = new AuthService();
