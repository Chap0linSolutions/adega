import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import routes from './routes';
import realtime from './realtime';

const PORT = 3000;

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(routes);

const io = new Server(server, { cors: { origin: '*' } });

realtime(io);

server.listen(PORT, () => {
  console.log(
    'The application is listening ' + 'on port http://192.168.0.49:' + PORT
  );
});
