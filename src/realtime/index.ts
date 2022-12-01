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

    this.socket.on('room-owner-is', (roomCode: string) => {
      const currentOwnerID = this.verifyOwner(roomCode);
      this.io.to(roomCode).emit('room-owner-is', currentOwnerID);
    });

    this.socket.on('player-turn', (roomCode: string) => {
      let currentTurnID = this.verifyTurn(roomCode);
      if (currentTurnID === undefined) {
        console.log('Current turn not found! Setting owner as next player!');
        this.setInitialTurn(roomCode);
        currentTurnID = this.verifyTurn(roomCode);
      }
      this.io.to(roomCode).emit('player-turn', currentTurnID);
    });

    this.socket.on('update-turn', (roomCode: string) => {
      this.updateTurn(roomCode);
    });

    this.socket.on('lobby-update', (roomCode) => {
      const players = JSON.stringify(this.rooms.get(roomCode)?.players);
      this.io.to(roomCode).emit('lobby-update', players);
    });

    this.socket.on('disconnect', () => {
      this.disconnect();
    });

    this.socket.on('games-update', (roomCode) => {
      console.log(`solicitado o update na lista de jogos da sala ${roomCode}.`);
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
      const playersWhoDrank = JSON.parse(value.players);
      const roomCode = value.roomCode;
      this.updateBeers(roomCode, playersWhoDrank);
    });

    this.socket.on('eu-nunca-suggestions', (roomCode) => {
      const suggestions = EuNunca.getSuggestions();
      this.socket.emit('eu-nunca-suggestions', suggestions);
    });

    this.socket.on('message', (value) => {
      this.handleGameMessage(value.room, value.message, value.payload);
    });

    this.socket.on('move-room-to', (value) => {
      this.handleMoving(value.roomCode, value.destination);
    });
  }

  joinRoom(roomCode: string) {
    console.log(`${this.socket.id} tentou se conectar à sala ${roomCode}\n`);
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

  verifyOwner(roomCode: string) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    return currentRoom?.ownerId;
  }

  setInitialTurn(roomCode: string) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    const currentOwner = currentRoom?.players.find(
      (player) => player.socketID === currentRoom.ownerId
    );
    if (currentOwner) currentOwner.currentTurn = true;
  }

  verifyTurn(roomCode: string) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    const currentTurn = currentRoom?.players.find(
      (player) => player.currentTurn === true
    );
    return currentTurn?.socketID;
  }

  updateTurn(roomCode: string) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    let currentTurnIndex = currentRoom?.players.findIndex(
      (player) => player.currentTurn === true
    );
    if (currentTurnIndex != undefined && currentRoom) {
      currentRoom.players[currentTurnIndex].currentTurn = false;
      if (currentTurnIndex < currentRoom.players.length - 1) {
        currentTurnIndex += 1;
      } else {
        currentTurnIndex = 0;
      }
    } else {
      currentTurnIndex = 0;
    }
    if (currentRoom) currentRoom.players[currentTurnIndex].currentTurn = true;
    console.log('Next player is:');
    console.log(
      this.runtimeStorage.rooms
        .get(roomCode)
        ?.players.find((player) => player.currentTurn === true)?.nickname
    );
  }

  addPlayer(newPlayerData: string) {
    let index = -1;
    let beerCount = 0;
    let currentTurn = false;
    const npd = { ...JSON.parse(newPlayerData), socketID: this.socket.id };

    const currentRoom = this.rooms.get(npd.roomCode);
    if (currentRoom?.ownerId === null && currentRoom) {
      console.log(`User ${npd.socketID} created new room ${npd.roomCode}`);
      currentRoom.ownerId = this.socket.id;
      currentTurn = true;
    }
    const players = currentRoom?.players;
    const playerID = Math.floor(10000 * Math.random());

    if (players) {
      players.forEach((p: player) => {
        //se já existir um player no jogo com o mesmo id de socket,
        //não vamos adicionar novamente e sim atualizar o existente
        if (p.socketID === this.socket.id) {
          beerCount = p.beers;
          index = players.indexOf(p);
        }
      });

      if (index >= 0) {
        // Player data update
        players.splice(index, 1);
      }

      currentRoom.players.push({
        ...npd,
        beers: beerCount,
        playerID: playerID,
        currentTurn: currentTurn,
      });
      this.rooms.delete(npd.roomCode);
      this.rooms.set(npd.roomCode, currentRoom);

      const playersNames: string[] = [];
      players.forEach((player) => playersNames.push(` ${player.nickname}`));

      console.log(`players atualmente na sala:${playersNames}\n`);
      this.io.to(npd.roomCode).emit('lobby-update', JSON.stringify(players));
      this.io.to(npd.roomCode).emit('room-owner-is', currentRoom.ownerId);
    }
  }

  sendMessage(message: string, room: string) {
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
          console.log(`o jogador ${p.nickname} saiu.\n`);
        }
      });
    }

    this.rooms.get(targetRoom)?.players.splice(index, 1);

    const currentRoom = this.rooms.get(targetRoom);
    const currentPlayers = this.rooms.get(targetRoom)?.players;

    if (
      currentPlayers &&
      currentRoom &&
      this.rooms.get(targetRoom)?.players.length &&
      !currentPlayers?.find((owner) => owner.socketID == currentRoom?.ownerId)
    ) {
      const newOwner = currentPlayers[0].socketID;
      currentRoom.ownerId = newOwner;
      console.log(`New room owner is: ${this.rooms.get(targetRoom)?.ownerId}`);
      this.io.to(targetRoom).emit('room-owner-is', newOwner);
    }

    this.rooms.get(targetRoom)?.currentGame?.handleDisconnect(this.socket.id);
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

    const selectedGame = gamesList.find((game) => game.name === gameDraw);
    if (selectedGame) {
      const selectedGameNumber = gamesList.indexOf(selectedGame);

      room.options.gamesList[selectedGameNumber].counter += 1;
      this.io.to(roomCode).emit('roulette-number-is', selectedGameNumber);
      console.log(
        `Próximo jogo: ${selectedGame.name} (escolhido ${selectedGame.counter} vezes.)`
      );
    }

    setTimeout(() => {
      //TODO: atualizar seleção do próximo jogo após a adição de todos os jogos da alfa
      const random = Math.round(Math.random());
      const nextRound =
        random === 0
          ? { url: '/OEscolhido', title: 'O Escolhido' }
          : { url: '/BangBang', title: 'Bang Bang' };
      this.handleMoving(roomCode, nextRound.url);
      this.runtimeStorage.startGameOnRoom(roomCode, nextRound.title, this.io);
    }, 5000);
  }

  updateBeers(roomCode: string, playersWhoDrank: player[]) {
    const room = this.rooms.get(roomCode)!;
    playersWhoDrank.forEach((player: player) => {
      room.players.find((p) => p.nickname === player.nickname)!.beers += 1;
    });
    console.log(`Sala ${roomCode} - Resumo do porre:`);
    room.players.forEach((player) => {
      console.log(`${player.nickname} - ${player.beers} cervejas`);
    });
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    new SocketConnection(io, socket);
  });
}

export default realtime;
