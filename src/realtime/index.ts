import { Socket, Server } from 'socket.io';
import Store, { player } from './store';
import { RoomContent } from './store';
import { gameList } from './games/GameOptions';

class SocketConnection {
  socket: Socket;
  io: Server;
  runtimeStorage: Store;
  currentRoom?: RoomContent;
  rooms: Map<string, RoomContent>;
  allPlayers: player[];

  constructor(io: Server, socket: Socket) {
    this.io = io;
    this.socket = socket;

    this.runtimeStorage = Store.getInstance();

    this.rooms = this.runtimeStorage.rooms;
    this.allPlayers = this.runtimeStorage.allPlayers;

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

    this.socket.on('games-update', (roomCode) => {
      //console.log(`solicitado o update na lista de jogos da sala ${roomCode}.`);
      this.socket.emit('games-update', gameList); // TODO: get only the games inside the room.
    });

    this.socket.on('roulette-number-is', (roomCode: string) => {
      this.handleNextGameSelection(roomCode);
    });

    this.socket.on('start-game', (value) => {
      console.log(
        `Sala ${value.roomCode} - solicitado o início do jogo ${value.gameName}.`
      );
      this.runtimeStorage.startGameOnRoom(
        value.roomCode,
        value.gameName,
        this.io
      );
    });

    this.socket.on('message', (value) => {
      this.handleGameMessage(value.room, value.message, value.payload);
    });

    this.socket.on('move-room-to', (value) => {
      this.handleMoving(value.roomCode, value.destination);
    });
  }

  joinRoom(roomCode: string) {
    //console.log(`${this.socket.id} tentou se conectar à sala ${roomCode}\n`);
    let reply = 'a sala não existe.';
    if (this.rooms.has(roomCode)) {
      this.socket.join(roomCode);
      this.currentRoom = this.rooms.get(roomCode);
      reply = `ingressou na sala ${roomCode}.`;
    }
    return reply;
  }

  createRoom(roomCode: string) {
    const newRoom = Store.emptyRoom();
    this.rooms.set(roomCode, newRoom);
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

    const currentRoom = this.rooms.get(npd.roomCode);
    const players = currentRoom?.players;
    let playerID = Math.floor(10000 * Math.random());

    //console.log(`players da sala antes: ${JSON.stringify(players)}\n`);

    if (players) {
      players.forEach((p: player) => {
        //se já existir um player no jogo com o mesmo id de socket, não vamos adicionar novamente e sim atualizar o existente
        if (p?.socketID === this.socket.id) {
          index = players.indexOf(p);
        }
      });

      if (index >= 0) {
        players.splice(index, 1);
        //console.log(`atualizados os dados do jogador ${npd.nickname}\n`);
      } else {
        // console.log(
        //   `adicionado os dados do jogador de ID ${
        //     this.socket.id
        //   } --> ${JSON.stringify(npd)}\n`
        // );
      }

      players.push(npd);
      this.rooms.delete(npd.roomCode);
      this.rooms.set(npd.roomCode, currentRoom);

      const playersNames: string[] = [];
      players.forEach((player) => playersNames.push(` ${player.nickname}`));

      //console.log(`players atualmente na sala:${playersNames}\n`);
      this.io.to(npd.roomCode).emit('lobby-update', JSON.stringify(players));
    }
  }

  sendMessage(message: string, room: string) {
    //console.log('hey\n', room, message);
    this.io.to(room).emit('message', { message, room });
  }

  disconnect() {
    let index = 0;
    let targetRoom = '';

    for (const room of this.rooms) {
      const players = room[1].players;
      players.forEach((p: player) => {
        if (p?.socketID === this.socket.id) {
          index = players.indexOf(p);
          targetRoom = p.roomCode;
          //console.log(`o jogador ${p.nickname} saiu.\n`);
        }
      });
    }
    this.rooms.get(targetRoom)?.players.splice(index, 1);
    this.io
      .to(targetRoom)
      .emit(
        'lobby-update',
        JSON.stringify(this.rooms.get(targetRoom)?.players)
      );
  }

  handleGameMessage(room: string, value: any, payload: any) {
    const currentGame = this.rooms.get(room)?.currentGame;
    //console.log(`tag: ${value}\n`);
    currentGame?.handleMessage(this.socket.id, value, payload);
  }

  handleMoving(roomCode: string, destination: string | number) {
    // console.log(
    //   `Solicitado o movimento da sala para o destino: ${destination}`
    // );
    this.io.to(roomCode).emit('room-is-moving-to', destination);
  }

  handleNextGameSelection(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    let possiblyNextGames: { name: string; index: number }[] = [];
    let index = 0;

    room.options.gamesList.forEach((game) => {
      if (game.counter < 4) {
        possiblyNextGames.push({ name: game.name, index: index });
      }
      index += 1;
    });

    if (possiblyNextGames.length === 0) {
      console.log('Todos os jogos já foram 4x. Zerando os contadores...');
      index = 0;
      possiblyNextGames = [];
      room.options.gamesList.forEach((game) => {
        game.counter = 0;
        if (game.name !== room.lastGameName) {
          possiblyNextGames.push({ name: game.name, index: index });
        }
        index += 1;
      });
    } else if (possiblyNextGames.length > 1) {
      possiblyNextGames = possiblyNextGames.filter(
        (game) => game.name !== room.lastGameName
      );
    }

    const selectedGameNumber = possiblyNextGames.at(
      Math.floor(Math.random() * possiblyNextGames.length)
    )!.index;
    room.options.gamesList.at(selectedGameNumber)!.counter += 1;
    room.lastGameName = room.options.gamesList.at(selectedGameNumber)!.name;

    this.io.to(roomCode).emit('roulette-number-is', selectedGameNumber);
    setTimeout(() => {
      //this.handleMoving(roomCode, '/Lobby');
      this.handleMoving(roomCode, '/BangBang');
      this.runtimeStorage.startGameOnRoom(roomCode, 'Bang Bang', this.io);
    }, 5000);
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    new SocketConnection(io, socket);
  });
}

export default realtime;
