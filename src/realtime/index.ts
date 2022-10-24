import { Socket, Server } from 'socket.io';
import Store, { player } from './store';

class SocketConnection {
  socket: Socket;
  io: Server;
  runtimeStorage: Store;
  rooms: Map<string, player[]>;

  constructor(io: Server, socket: Socket) {
    this.io = io;
    this.socket = socket;

    this.runtimeStorage = Store.getInstance();
    this.rooms = this.runtimeStorage.rooms;

    console.log(`Conexão socket estabelecida - ID do cliente ${socket.id}\n`);
    this.socket.emit('connection', 'OK');

    this.socket.on('join-room', (roomCode, callback) => {
      const reply = this.joinRoom(roomCode);
      callback(reply);
    });

    this.socket.on('create-room', (roomCode) => {
      this.createRoom(roomCode);
    });

    this.socket.on('room-exists', (roomCode) => {
      this.verifyIfRoomExists(roomCode);
    });

    this.socket.on('add-player', (newPlayerData) => {
      this.addPlayer(newPlayerData);
    });

    this.socket.on('disconnect', () => {
      this.disconnect();
    });

    this.socket.on('message', (value) => {
      this.handleMessage(value.message, value.room, value.payload);
    });
  }

  joinRoom(roomCode: string) {
    console.log(`${this.socket.id} tentou se conectar à sala ${roomCode}\n`);
    let reply = 'a sala não existe.';
    if (this.rooms.has(roomCode)) {
      this.socket.join(roomCode);
      reply = `ingressou na sala ${roomCode}.`;
    }
    return reply;
  }

  createRoom(roomCode: string) {
    this.rooms.set(roomCode, []);
    this.socket.emit('create-room', `sala ${roomCode} criada com sucesso.`);
  }

  verifyIfRoomExists(roomCode: string) {
    let reply = 'a sala não existe.';
    if (this.rooms.has(roomCode)) {
      reply = `a sala ${roomCode} existe.`;
    }
    this.socket.emit('room-exists', reply);
  }

  addPlayer(newPlayerData: string) {
    let index = -1;
    const npd = { ...JSON.parse(newPlayerData), socketID: this.socket.id };

    const players = this.rooms.get(npd.roomCode);

    console.log(`players da sala antes: ${JSON.stringify(players)}\n`);

    if (players) {
      players.forEach((p: player) => {
        //se já existir um player no jogo com o mesmo id de socket, não vamos adicionar novamente e sim atualizar o existente
        if (p.socketID === this.socket.id) {
          index = players.indexOf(p);
        }
      });

      if (index >= 0) {
        players.splice(index, 1);
        console.log(`atualizados os dados do jogador ${JSON.stringify(npd)}\n`);
      } else {
        console.log(
          `adicionado os dados do jogador de ID ${
            this.socket.id
          } --> ${JSON.stringify(npd)}\n`
        );
      }

      players.push(npd);
      this.rooms.delete(npd.roomCode);
      this.rooms.set(npd.roomCode, players);

      console.log(`players atualmente na sala:  ${JSON.stringify(players)}\n`);
      this.io.to(npd.roomCode).emit('lobby-update', JSON.stringify(players));
    }
  }

  sendMessage(message: string, room: string) {
    console.log('hey\n', room, message);
    this.io.to(room).emit('message', { message, room });
  }

  disconnect() {
    let index = 0;
    let targetRoom = '';

    for (const room of this.rooms) {
      const players = room[1];
      players.forEach((p: player) => {
        if (p.socketID === this.socket.id) {
          index = players.indexOf(p);
          targetRoom = p.roomCode;
          console.log(`o jogador ${JSON.stringify(p)} saiu.\n`);
        }
      });
    }
    this.rooms.get(targetRoom)?.splice(index, 1);
    this.io
      .to(targetRoom)
      .emit('lobby-update', JSON.stringify(this.rooms.get(targetRoom)));
  }

  handleMessage(value: any, room: string, payload: any) {
    console.log(`tag: ${value}\n`);
    if (value === 'player_ready') {
      if (
        this.runtimeStorage.players.find(
          (p: any) => p.id === this.socket.id
        ) === undefined
      ) {
        this.runtimeStorage.players.push({
          id: this.socket.id,
        });
      }

      console.log('jogadores atualmente ');

      if (this.runtimeStorage.players.length === 2) {
        this.sendMessage('start_timer', '1');
      }
    }

    if (value === 'shot') {
      const player = this.runtimeStorage.players.find(
        (p: any) => p.id === this.socket.id
      );
      player.time = payload.time;
      console.log(player.time);

      const hasFired = this.runtimeStorage.players
        .map((p: any) => !!p.time)
        .reduce((ac: any, at: any) => ac && at);
      console.log(hasFired);
      if (hasFired) {
        const winnerID = this.runtimeStorage.players.sort(
          (a: any, b: any) => b.time - a.time
        )[0].id;
        this.io
          .to('1')
          .emit('message', { message: 'bangbang_result', id: winnerID });
      }
    }
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    new SocketConnection(io, socket);
  });
}

export default realtime;
