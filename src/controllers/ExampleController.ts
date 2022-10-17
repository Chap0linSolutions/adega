import { Request, Response } from 'express';

export default class ExampleController{
  async index(req: Request, res: Response){
    res.status(200).send('Bem vindo à adega!');
  }
}