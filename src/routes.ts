import express from 'express';

import ExampleController from './controllers/ExampleController';
const exampleController = new ExampleController();

import RoomAccessController from './controllers/RoomAccessController';
const roomAccessController = new RoomAccessController();

const routes = express.Router();

routes.get('/', (req, res) => {
  res.send('Bem vindo à adega!');
});

routes.get('/roomCode/:code', roomAccessController.joinRoom);
routes.put('/createRoom', roomAccessController.createRoom);

routes.get('/example', exampleController.index);

export default routes;
