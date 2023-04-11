import ExampleController from './ExampleController';
import { getMockReq, getMockRes } from '@jest-mock/express'

test("Testing index method from ExampleController class", async () => {
  const controller = new ExampleController();
  const req = getMockReq();
  const { res, next } = getMockRes();

  await controller.index(req, res);
  expect(res.status).toBeCalledWith(200);
});