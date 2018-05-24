import { Request, Response } from 'express';

export class RequestError {
  message: string;
  statusCode: number;
  body: any;
  constructor(code: number, message: string, body: any) {
    this.message = message;
    this.statusCode = code;
    this.body = body;
  }

  report(req: Request, res: Response) {
    if (req.accepts('json'))
      res
        .status(this.statusCode)
        .contentType('json')
        .send(this);
    else
      res.status(this.statusCode).contentType('text').send(`
        ${this.message}
      `);
  }
}

export class BadRequestError extends RequestError {
  constructor(body: object) {
    super(400, 'BadRequest', body);
  }
}
