import { Response } from 'express';

export class Controller {
  protected sendResponse(res: Response, data: any, message: string = 'Success', status: number = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }

  protected sendError(res: Response, message: string = 'Error', status: number = 400, errors: any = null) {
    return res.status(status).json({
      success: false,
      message,
      errors,
    });
  }
}
