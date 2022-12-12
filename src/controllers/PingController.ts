import { Request, Response } from 'express';

export default class PingController {
  async pingPong(req: Request, res: Response) {
    res.status(200).send('Pong');
  }
}