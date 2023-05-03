import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import routes from './routes';
import realtime from './realtime';

if(process.argv[2]){
  const PORT = Number(process.argv[2]);
  if(Number.isNaN(PORT)){
    console.log('Porta especificada inválida.');
    process.exit(0);
  } else {
    const app = express();
    const server = http.createServer(app);
    app.use(cors());
    app.use(routes);

    const io = new Server(server, { cors: { origin: '*' } });

    realtime(io);

    server.listen(PORT, () => {
      console.log(
        'A aplicação está rodando em http://localhost:' + PORT
      );
    });   
  }
} else {
  console.log('É preciso especificar a porta em que o servidor vai rodar.');
  process.exit(0);
}
