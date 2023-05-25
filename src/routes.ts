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

routes.put('/create', roomAccessController.createRoom);
routes.get('/check', roomAccessController.checkRoom);

routes.get('/example', exampleController.index);

routes.get('/nickname', roomPlayerNameController.checkNameAvailabiliy);

routes.get('/returning', roomAccessController.checkIfUserWasThere);

export default routes;
