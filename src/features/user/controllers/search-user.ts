import { Helpers } from '@global/helpers/helpers';
import { userService } from '@service/db/user.service';
import { SearchUser } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Search {
  public async user(req: Request, res: Response): Promise<void> {
    const regexp = new RegExp(Helpers.escapeRegex(req.params.query), 'i');
    const users: SearchUser[] = await userService.searchUsers(regexp);
    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Search results', search: users });
  }
}
