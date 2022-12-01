import express from 'express';

import ExampleController from './controllers/ExampleController';
const exampleController = new ExampleController();

import RoomAccessController from './controllers/RoomAccessController';
const roomAccessController = new RoomAccessController();

import RoomPlayerNameController from './controllers/RoomPlayerNamesController';
const roomPlayerNameController = new RoomPlayerNameController();

const routes = express.Router();

routes.get('/', (req, res) => {
  res.send('Bem vindo à adega!');
});

routes.get('/roomCode/:code', roomAccessController.joinRoom);
routes.put('/createRoom', roomAccessController.createRoom);

routes.get('/example', exampleController.index);

routes.get(
  '/nicknameCheck/:roomCode/:userName',
  roomPlayerNameController.checkNameAvailabiliy
);

export default routes;
