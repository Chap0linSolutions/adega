import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import { Server } from 'socket.io';

import routes from './routes';
import realtime from './realtime';

const PORT = 3000;

const app = express();
const server = https.createServer({key: fs.readFileSync('privkey.pem'), cert: fs.readFileSync('cert.pem')}, app);
app.use(cors());
app.use(routes);

const io = new Server(server, { cors: { origin: '*' } });

realtime(io);

server.listen(PORT, () => {
  console.log(
    'The application is listening ' + 'on port https://localhost:' + PORT
  );
});
