import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { imageService } from '@service/db/image.service';
import { FileImageDocument } from '@image/interfaces/image.interface';

export class Get {
  public async images(req: Request, res: Response): Promise<void> {
    const images: FileImageDocument[] = await imageService.getImages(
      req.params.userId
    );
    res.status(HTTP_STATUS.OK).json({ message: 'User images', images });
  }
}
