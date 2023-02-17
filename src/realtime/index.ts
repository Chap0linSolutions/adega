import { Socket, Server } from 'socket.io';
import Store, { player, RoomContent } from './store';
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

    this.socket.on('get-player-name-by-id', (playerID) => {
      this.getPlayerNameByID(playerID);
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
      this.sendPlayerList(roomCode);
    });

    this.socket.on('disconnect', () => {
      this.disconnect();
    });

    this.socket.on('selected-games-are', (value) => {
      this.updateRoomGameSelection(value.roomCode, value.selectedGames);
    });

    this.socket.on('games-update', (roomCode) => {
      this.sendRoomGames(roomCode);
    });

    this.socket.on('roulette-number-is', (roomCode: string) => {
      this.handleNextGameSelection(roomCode);
    });

    this.socket.on('get-current-game-by-room', (roomCode: string) => {
      this.getCurrentGameByRoom(roomCode);
    });

    this.socket.on('start-game', (value) => {
      console.log(
        `Sala ${value.roomCode} - solicitado o início do jogo ${value.nextGame}.`
      );
      this.runtimeStorage.startGameOnRoom(
        value.roomCode,
        value.nextGame,
        this.io
      );
      this.handleMoving(value.roomCode, this.URL(value.nextGame));
    });

    this.socket.on('players-who-drank-are', (value) => {
      const playersWhoDrank = JSON.parse(value.players);
      const roomCode = value.roomCode;
      this.updateBeers(roomCode, playersWhoDrank);
    });

    this.socket.on('eu-nunca-suggestions', () => {
      const suggestions = EuNunca.getStandardSuggestions();
      this.socket.emit('eu-nunca-suggestions', suggestions);
    });

    this.socket.on('message', (value) => {
      this.handleGameMessage(value.room, value.message, value.payload);
    });

    this.socket.on('move-room-to', (value) => {
      this.handleMoving(value.roomCode, value.destination);
    });
  }

  sendRoomGames(roomCode: string) {
    const roomGames = this.rooms
      .get(roomCode)!
      .options.gamesList.map((game) => game.name);
    this.io.to(roomCode).emit('games-update', roomGames);
  }

  updateRoomGameSelection(roomCode: string, selectedGames: string) {
    const selection: string[] = JSON.parse(selectedGames);
    const previousRoomGames = this.rooms.get(roomCode)!.options.gamesList;
    const newRoomGames = selection.map((gameName) => {
      const index = previousRoomGames.findIndex(
        (game) => game.name === gameName
      );
      return {
        name: gameName,
        counter: index >= 0 ? previousRoomGames[index].counter : 0,
      };
    });
    this.rooms.get(roomCode)!.options.gamesList = newRoomGames;
    console.log(`Sala ${roomCode} - Jogos escolhidos: `);
    console.log((this.rooms.get(roomCode)!.options.gamesList = newRoomGames));
    this.sendRoomGames(roomCode);
  }

  getCurrentGameByRoom(roomCode: string) {
    const currentRoom = this.rooms.get(roomCode);
    const currentGame = currentRoom?.currentGame;
    const gameName = currentGame?.gameName;
    const gameNameNormalized = gameName
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '')
      .replace(/,/g, '');

    this.socket.emit('current-game-is', gameNameNormalized);

    if (currentGame?.gameName == 'Bang Bang') {
      this.io.to(roomCode).emit('message', { message: 'start_timer' });
    }
  }

  joinRoom(roomCode: string) {
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

  getPlayerNameByID(playerID: string) {
    let targetRoom = '';
    let playerName = undefined;

    for (const room of this.rooms) {
      const players = room[1].players;
      players.forEach((p: player) => {
        if (p?.socketID === playerID) {
          targetRoom = p.roomCode;
          playerName = p.nickname;
        }
      });
    }

    if (playerName != undefined) {
      this.io.to(targetRoom).emit('player-name', playerName);
    }
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

    index = currentRoom!.disconnectedPlayers.findIndex(
      (player) => player.nickname === npd.nickname
    );
    if (index > -1) {
      console.log(
        `Sala ${npd.roomCode} - ${npd.nickname} está voltando à partida.`
      );
      const returningPlayer = currentRoom!.disconnectedPlayers.splice(index, 1);
      beerCount = returningPlayer[0].beers;
      index = -1;
    }

    if (currentRoom?.ownerId === null && currentRoom) {
      console.log(
        `Sala ${npd.roomCode} - acabou de ser criada pelo usuário ${npd.socketID}.`
      );
      currentRoom.ownerId = this.socket.id;
      currentTurn = true;
    }
    const players = currentRoom?.players;

    if (players) {
      const existingPlayerIndex = players.findIndex(
        (p: player) => p.socketID === this.socket.id
      );

      if (existingPlayerIndex > -1) {
        players[existingPlayerIndex] = {
          ...players[existingPlayerIndex],
          avatarSeed: npd.avatarSeed,
          nickname: npd.nickname,
        };
      } else {
        players.push({
          ...npd,
          beers: beerCount,
          playerID: players.length,
          currentTurn: currentTurn,
        });
      }

      this.rooms.set(npd.roomCode, {
        ...currentRoom,
        players: players.map((p, index) => {
          return { ...p, playerID: index };
        }),
      });

      this.sendPlayerList(npd.roomCode);
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

          if (p.currentTurn == true && players.length > 0) {
            if(room[1].currentGame !== null){
              this.updateTurn(targetRoom); 
              const currentTurnID = this.verifyTurn(targetRoom);
              this.io.to(targetRoom).emit('room-is-moving-to', '/SelectNextGame');
              room[1].currentGame = null;
              this.io.to(targetRoom).emit('player-turn', currentTurnID);
              //TODO: pop-up de aviso que o jogador da vez caiu por isso o retorno à pagina da roleta
            }
          }
        }
      });
    }

    const disconnectedPlayer = this.rooms
      .get(targetRoom)
      ?.players.splice(index, 1);
    this.rooms.get(targetRoom)?.disconnectedPlayers.push({
      ...disconnectedPlayer![0],
      currentTurn: false,
    });

    this.sendPlayerList(targetRoom);

    if (this.rooms.get(targetRoom)?.players.length == 0) {
      console.log('Room empty! Deleting from room list...');
      return this.rooms.delete(targetRoom);
    }

    const currentRoom = this.rooms.get(targetRoom);
    const currentPlayers = currentRoom?.players;

    if (
      currentPlayers &&
      !currentPlayers?.find((owner) => owner.socketID == currentRoom?.ownerId)
    ) {
      const newOwner = currentPlayers[0].socketID;
      currentRoom.ownerId = newOwner;
      console.log(`New room owner is: ${this.rooms.get(targetRoom)?.ownerId}`);
      this.io.to(targetRoom).emit('room-owner-is', newOwner);
    }

    if (currentPlayers?.length === 1) {
      console.log(
        'Não é possível jogar com apenas uma pessoa. Voltando para o lobby.'
      );
      return this.io.to(targetRoom).emit('room-is-moving-to', '/Lobby');
    }

    this.rooms.get(targetRoom)?.currentGame?.handleDisconnect(this.socket.id);
    if (this.rooms.get(targetRoom)?.players.length == 0) {
      console.log('Room empty! Deleting from room list...');
      this.rooms.delete(targetRoom);
    }
  }

  handleGameMessage(room: string, value: any, payload: any) {
    const currentGame = this.rooms.get(room)?.currentGame;
    currentGame?.handleMessage(this.socket.id, value, payload);
  }

  handleMoving(roomCode: string, destination: string | number) {
    if(destination === '/SelectNextGame'){
      this.rooms.get(roomCode)!.currentGame = null;
    }
    this.io.to(roomCode).emit('room-is-moving-to', destination);
  }

  handleNextGameSelection(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (!room.options.gamesList.find((game) => game.counter === 0)) {
      //checkToLower
      console.log('Todos os jogos possíveis com contador > 0.');
      room.options.gamesList.forEach((game) => (game.counter -= 1)); //lowerAllCounters
    }

    const gamesList = room.options.gamesList;
    const drawableOptions = gamesList
      .filter((game) => game.name !== room.lastGameName) //remove o último jogo que saiu
      .filter((game) => game.counter < 4); //filtra os jogos que já saíram 4x
    const gameDrawIndex = Math.floor(Math.random() * drawableOptions.length); //sorteio
    const gameDraw = drawableOptions[gameDrawIndex]; //pegando jogo sorteado
    room.lastGameName = gameDraw.name;

    const selectedGame = gamesList.findIndex(g => g === gameDraw);
    room.options.gamesList[selectedGame].counter += 1;
    this.io.to(roomCode).emit('roulette-number-is', selectedGame);
    console.log(`Sala ${roomCode} - Próximo jogo: ${gameDraw.name}.`);
  }

  URL(input: string) {
    const output = input
      .replace('', '/') //insere a barra
      .replace(/ /g, '') //remove espaços, acentos e caracteres especiais
      .replace(/,/g, '')
      .replace(/-/g, '')
      .replace(/á/g, 'a')
      .replace(/é/g, 'e');
    return output;
  }

  updateBeers(roomCode: string, playersWhoDrank: player[]) {
    const room = this.rooms.get(roomCode)!;
    playersWhoDrank.forEach((player: player) => {
      try{
        room.players.find((p) => p.nickname === player.nickname)!.beers += 1;
      } catch (e) {
        try {
          room.disconnectedPlayers.find((p) => p.nickname === player.nickname)!.beers += 1;
        } catch (f) {
          console.log(`Sala ${roomCode} - o jogador ${player.nickname} não está conectado nem disconectado (wtf, really)`);
        }
      }
    });
  }

  sendPlayerList(roomCode: string) {
    const currentRoom = this.rooms.get(roomCode);
    if (currentRoom) {
      const players = currentRoom.players.sort((a, b) =>
        b.beers - a.beers === 0 ? a.playerID - b.playerID : b.beers - a.beers
      );
      this.io.to(roomCode).emit('lobby-update', JSON.stringify(players));
    }
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    new SocketConnection(io, socket);
  });
}

export default realtime;
