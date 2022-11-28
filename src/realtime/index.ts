import { Socket, Server } from 'socket.io';
import Store, { player, RoomContent } from './store';
import { gameList } from './games/GameOptions';
import { EuNunca } from './games/EuNunca/EuNunca';
class SocketConnection {
  socket: Socket;
  io: Server;
  runtimeStorage: Store;
  currentRoom?: RoomContent;
  rooms: Map<string, RoomContent>;

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

    this.socket.on('room-exists', (roomCode) => {
      this.verifyIfRoomExists(roomCode);
    });

    this.socket.on('add-player', (newPlayerData) => {
      this.addPlayer(newPlayerData);
    });

    this.socket.on('lobby-update', (roomCode) => {
      const players = JSON.stringify(this.rooms.get(roomCode)?.players);
      this.io.to(roomCode).emit('lobby-update', players);
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

    this.socket.on('players-who-drank-are', (value) => {
      const playersWhoDrank = value.players;
      const roomCode = value.roomCode;
      this.updateBeers(roomCode, playersWhoDrank);
    })

    this.socket.on('who-drank-dummy-players', () => {       //dummy - apagar quando integrar ao resto do jogo
      console.log('enviando lista dummy de jogadores...');
      this.sendDummyPlayerList();
    });

    this.socket.on('eu-nunca-suggestions', (roomCode) => {
      const suggestions = EuNunca.getSuggestions();
      this.socket.emit('eu-nunca-suggestions', suggestions);
    })

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
    const players = this.rooms.get(roomCode);
    if (players) {
      this.socket.join(roomCode);
      this.currentRoom = this.rooms.get(roomCode);
      reply = `ingressou na sala ${roomCode}.`;
    }
    return reply;
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
    let beerCount = 0;
    const npd = { ...JSON.parse(newPlayerData), socketID: this.socket.id };

    const currentRoom = this.rooms.get(npd.roomCode);
    const players = currentRoom?.players;
    let playerID = Math.floor(10000 * Math.random());

    if (players) {
      players.forEach((p: player) => {
        //se já existir um player no jogo com o mesmo id de socket, não vamos adicionar novamente e sim atualizar o existente
        if (p.socketID === this.socket.id) {
          beerCount = p.beers;
          index = players.indexOf(p);
        }
      });

      if (index >= 0) {
        //removendo dados antigos para colocar os novos no lugar (no caso de ser atualização do player)
        players.splice(index, 1);
      }

      currentRoom.players.push({
        ...npd,
        beers: beerCount,
        playerID: playerID,
      });
      this.rooms.delete(npd.roomCode);
      this.rooms.set(npd.roomCode, currentRoom);

      const playersNames: string[] = [];
      players.forEach((player) => playersNames.push(` ${player.nickname}`));

      console.log(`players atualmente na sala:${playersNames}\n`);
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
    if (this.rooms.get(targetRoom)?.players.length == 0) {
      console.log('Room empty! Deleting from room list...');
      this.rooms.delete(targetRoom);
    }
    this.io
      .to(targetRoom)
      .emit(
        'lobby-update',
        JSON.stringify(this.rooms.get(targetRoom)?.players)
      );
  }

  handleGameMessage(room: string, value: any, payload: any) {
    const currentGame = this.rooms.get(room)?.currentGame;
    currentGame?.handleMessage(this.socket.id, value, payload);
  }

  handleMoving(roomCode: string, destination: string | number) {
    this.io.to(roomCode).emit('room-is-moving-to', destination);
  }

  handleNextGameSelection(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (!room.options.gamesList.find((game) => game.counter === 0)) {
      //checkToLower
      console.log('Todos os jogos com contador > 0.');
      room.options.gamesList.forEach((game) => (game.counter -= 1)); //lowerAllCounters
    }

    const gamesList = room?.options.gamesList;
    const drawableOptions = gamesList.filter((game) => game.counter < 4); //filtra jogos que já saíram 4x
    const gameDrawIndex = Math.floor(Math.random() * drawableOptions.length); //sorteio
    const gameDraw = drawableOptions[gameDrawIndex].name; //pegando jogo sorteado

    const selectedGame = gamesList.find((game) => game.name === gameDraw)!;
    const selectedGameNumber = gamesList.indexOf(selectedGame);

    room.options.gamesList[selectedGameNumber].counter += 1;
    this.io.to(roomCode).emit('roulette-number-is', selectedGameNumber);
    console.log(
      `Próximo jogo: ${selectedGame.name} (escolhido ${selectedGame.counter} vezes.)`
    );

    setTimeout(() => {
      this.handleMoving(roomCode, '/BangBang');
      this.runtimeStorage.startGameOnRoom(roomCode, 'Bang Bang', this.io);
    }, 5000);
  }

  updateBeers(roomCode: string, playersWhoDrank: player[]){
    // const room = this.rooms.get(roomCode)!;                //descomentar estas linhas quando integrar ao resto do código
    // playersWhoDrank.forEach((player:player) => {
    //   room.players.find(p => p.nickname === player.nickname)!.beers += 1;
    // })
    console.log(`Sala ${roomCode} - O jogadores que beberam:`);
    console.log(playersWhoDrank);
  }

  sendDummyPlayerList(){
    const players = [
      {
        nickname: 'Dom Quixote',
        avatarSeed: 'alex',
        id: 0,
      },
      {
        nickname: 'Sancho Pança',
        avatarSeed: 'schp',
        id: 1,
      },
      {
        nickname: 'Dulcineia',
        avatarSeed: 'dcna',
        id: 2,
      },
      {
        nickname: 'Cavalo do Dom Quixote',
        avatarSeed: 'cvlo',
        id: 3,
      },
      {
        nickname: 'Moinho de Vento',
        avatarSeed: 'mnho',
        id: 4,
      },
    ]

    this.socket.emit('lobby-update', players);
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    new SocketConnection(io, socket);
  });
}

export default realtime;
