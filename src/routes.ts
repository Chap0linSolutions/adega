import express from 'express';

import ExampleController from './controllers/ExampleController';
const exampleController = new ExampleController();


const routes = express.Router();

routes.get('/', (req, res) => {
  res.send('Bem vindo à adega!');
});

routes.get("/example", exampleController.index)

export default routes;