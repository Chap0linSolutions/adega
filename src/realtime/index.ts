import { Socket, Server } from 'socket.io';
import Store, { player, RoomContent } from './store';

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

    console.log(`Conexão socket estabelecida - ID do cliente ${socket.id}`);
    this.socket.emit('connection', 'OK');

    this.socket.on('join-room', (roomCode, callback) => {
      const reply = this.joinRoom(roomCode);
      callback(reply);
    });

    this.socket.on('kick-player', (value) => {
      this.io.to(value.roomCode).emit('kick-player', value.nickname);
    });

    this.socket.on('room-exists', (roomCode) => {
      this.verifyIfRoomExists(roomCode);
    });

    this.socket.on('add-player', (newPlayerData) => {
      this.addPlayer(newPlayerData);
    });

    this.socket.on('room-owner-is', (roomCode: string) => {
      const owner = this.getOwner(roomCode);
      this.io.to(roomCode).emit('room-owner-is', owner);
    });

    this.socket.on('update-turn', (roomCode: string) => {
      this.updateTurn(roomCode);
    });

    this.socket.on('lobby-update', (roomCode) => {
      sendPlayerList(this.io, roomCode);
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

    this.socket.on('get-current-state-by-room', (roomCode: string) => {
      this.getCurrentStateByRoom(roomCode);
    });

    this.socket.on('players-who-drank-are', (value) => {
      const playersWhoDrank = JSON.parse(value.players);
      const roomCode = value.roomCode;
      const beers = value.beers;
      this.updateBeers(roomCode, playersWhoDrank, beers);
    });

    this.socket.on('message', (value) => {
      this.handleGameMessage(value.room, value.message, value.payload);
    });

    this.socket.on('move-room-to', (value) => {
      handleMoving(this.io, value.roomCode, value.destination);
    });
  }

  sendRoomGames(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const roomGames = room.options.gamesList.map((game) => game.name);
    this.io.to(roomCode).emit('games-update', roomGames);
  }

  updateRoomGameSelection(roomCode: string, selectedGames: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const selection: string[] = JSON.parse(selectedGames);
    const previousRoomGames = room.options.gamesList;
    const newRoomGames = selection.map((gameName) => {
      const index = previousRoomGames.findIndex(
        (game) => game.name === gameName
      );
      return {
        name: gameName,
        counter: index >= 0 ? previousRoomGames[index].counter : 0,
      };
    });
    room.options.gamesList = newRoomGames;
    this.sendRoomGames(roomCode);
  }

  getCurrentStateByRoom(roomCode: string) {
    const currentRoom = this.rooms.get(roomCode);
    const currentGame = currentRoom?.currentGame;
    const gameName = currentGame?.gameName;
    if (typeof gameName === 'string') {
      const currentState = {
        URL: URL(gameName),
        page: currentRoom?.currentPage,
      };
      this.socket.emit('current-state-is', JSON.stringify(currentState));
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

  getOwner(roomCode: string) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    if (currentRoom) {
      const owner = currentRoom.players.filter(
        (p) => p.socketID === currentRoom.ownerId
      );

      if (owner.length) {
        currentRoom.currentGame &&
          console.log(
            `Sala ${roomCode} - Owner da sala: ${owner[0].nickname}.`
          );
        return owner[0].nickname;
      }
      console.log(`Sala ${roomCode} - não há owners aqui.`);
      return 'no one';
    }
  }

  updateTurn(roomCode: string) {
    const currentTurnIndex = this.getCurrentTurnIndex(roomCode);
    const nextPlayer = this.getNextPlayer(roomCode, currentTurnIndex);
    console.log(`Sala ${roomCode} - O próximo jogador é ${nextPlayer?.nickname}.`);
  }

  getCurrentTurnIndex(roomCode: string) {
    let currentTurnIndex = -1;
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    if (currentRoom) {
      const currentPlayerPlaying = currentRoom.players.find(
        (player) => player.currentTurn === true
      );
      if (currentPlayerPlaying) {
        currentTurnIndex = currentRoom.playerOrder.findIndex(
          (player) => player === currentPlayerPlaying?.nickname
        );
      }
    }
    return currentTurnIndex;
  }

  getNextPlayer(roomCode: string, currentTurnIndex: number) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    let nextTurnIndex = 0;
    if (currentRoom) {
      if (currentTurnIndex < currentRoom.playerOrder.length - 1) {
        nextTurnIndex = currentTurnIndex + 1;
      }
      currentRoom.players.forEach((player) => {
        player.nickname === currentRoom.playerOrder[nextTurnIndex]
          ? (player.currentTurn = true)
          : (player.currentTurn = false);
      });

      return currentRoom.players.find(
        (player) => player.nickname === currentRoom.playerOrder[nextTurnIndex]
      );
    }
  }

  addPlayer(newPlayerData: string) {
    let index = -1;
    let beerCount = 0;
    let currentTurn = false;
    let returningPlayer = false;

    const npd = { ...JSON.parse(newPlayerData), socketID: this.socket.id };
    const currentRoom = this.rooms.get(npd.roomCode);
    if (!currentRoom) return;

    index = currentRoom.disconnectedPlayers.findIndex(
      (player) => player.nickname === npd.nickname
    );
    if (index > -1) {
      console.log(
        `Sala ${npd.roomCode} - ${npd.nickname} está voltando à sala.`
      );
      returningPlayer = true;
      const whosReturning = currentRoom.disconnectedPlayers.splice(index, 1);
      beerCount = whosReturning[0].beers;
      index = -1;
    }

    if (currentRoom?.ownerId === null && currentRoom) {
      console.log(
        `Sala ${npd.roomCode} - acabou de ser criada pelo usuário ${npd.nickname}.`
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
        this.updateTurnList(npd.roomCode);
      }

      this.rooms.set(npd.roomCode, {
        ...currentRoom,
        players: players.map((p, index) => {
          return { ...p, playerID: index };
        }),
      });

      sendPlayerList(this.io, npd.roomCode);
      this.io
        .to(npd.roomCode)
        .emit('room-owner-is', this.getOwner(npd.roomCode));

      if (returningPlayer) {
        const ongoingGame = currentRoom.currentGame;
        if (ongoingGame) {
          if (ongoingGame.gameName === 'Quem Bebeu') {
            const canGetBack = ongoingGame.playerGameData.find(
              (p: player) => p.nickname === npd.nickname
            );
            if (canGetBack) {
              console.log(
                `Sala ${npd.roomCode} - ${npd.nickname} pode voltar para a tela 'Quem Bebeu'.`
              );
              return this.socket.emit('room-is-moving-to', '/quembebeu');
            }
          } else if (
            ongoingGame.gameName === 'O Escolhido' ||
            ongoingGame.gameName === 'Bang Bang' ||
            ongoingGame.gameName === 'Titanic' ||
            ongoingGame.gameName === 'Mestre da Mímica' ||
            ongoingGame.gameName === 'Qual O Desenho' ||
            ongoingGame.gameName === 'Linha do Tempo'
          ) {
            const wasPlaying = ongoingGame.playerGameData.find(
              (p: player) => p.nickname === npd.nickname
            );
            if (wasPlaying) {
              this.socket.emit('cant-go-back-to', ongoingGame.gameName);
            }
          }
        }
      }
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
          console.log(`Sala ${room[0]} - ${p.nickname} desconectou-se.`);

          if (p.currentTurn == true && room[1].currentGame !== null) {
            this.updateTurn(targetRoom);
            const currentTurnName = getTurn(targetRoom);
            this.io.to(targetRoom).emit('player-turn-is', currentTurnName);
            if((room[1].currentGame.gameName !== 'Quem Sou Eu') && (room[1].currentGame.gameType !== 'simple')){
              handleMoving(this.io, targetRoom, '/roleta');
            } else {
              this.io.to(targetRoom).emit('original-player-is-down');
            }
          }
        }
      });
    }

    const disconnectedPlayer = this.rooms
      .get(targetRoom)
      ?.players.splice(index, 1);

    if (!disconnectedPlayer) return;

    this.rooms.get(targetRoom)?.disconnectedPlayers.push({
      ...disconnectedPlayer[0],
      currentTurn: false,
    });

    this.updateTurnList(targetRoom);
    sendPlayerList(this.io, targetRoom);

    if (this.rooms.get(targetRoom)?.players.length == 0) {
      console.log('Room empty! Deleting from room list...');
      return this.rooms.delete(targetRoom);
    }

    const currentRoom = this.rooms.get(targetRoom);
    const currentPlayers = currentRoom?.players;

    if (
      currentPlayers &&
      !currentPlayers?.find((player) => player.socketID == currentRoom?.ownerId)
    ) {
      const newOwner = currentPlayers[0];
      currentRoom.ownerId = newOwner.socketID;
      console.log(`New room owner is: ${newOwner.nickname}`);
      this.io.to(targetRoom).emit('room-owner-is', newOwner.nickname);
    }

    if (currentPlayers?.length === 1) {
      console.log(
        'Não é possível jogar com apenas uma pessoa. Voltando para o lobby.'
      );
      return handleMoving(this.io, targetRoom, '/saguao');
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

  updateBeers(roomCode: string, playersWhoDrank: player[], qtdBeers?: number) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    playersWhoDrank.forEach((player: player) => {
      const targetPlayerIsConnected = room.players.find(
        (p) => p.nickname === player.nickname
      );
      try {
        if (targetPlayerIsConnected) {
          const pl = room.players.find((p) => p.nickname === player.nickname);
          if (pl) pl.beers += qtdBeers ? qtdBeers : 1;
        } else {
          const pl = room.disconnectedPlayers.find(
            (p) => p.nickname === player.nickname
          );
          if (pl) pl.beers += qtdBeers ? qtdBeers : 1;
        }
      } catch (e) {
        console.log(
          `Sala ${roomCode} - o jogador ${player.nickname} não está conectado nem disconectado (wtf, really)`
        );
      }
    });
  }

  updateTurnList(roomCode: string) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    if (currentRoom != undefined) {
      const currentPlayers = <string[]>[];
      currentRoom.players.forEach((player) =>
        currentPlayers.push(player.nickname)
      );

      if (currentPlayers.length < currentRoom.playerOrder.length) {
        currentRoom.playerOrder.forEach((player) => {
          if (currentPlayers.indexOf(player) < 0) {
            const index = currentRoom.playerOrder.indexOf(player);
            currentRoom.playerOrder.splice(index, 1);
          }
        });
      } else if (currentPlayers.length > currentRoom.playerOrder.length) {
        currentPlayers.forEach((player) => {
          if (currentRoom.playerOrder.indexOf(player) < 0) {
            currentRoom.playerOrder.push(player);
          }
        });
      }
    }
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    new SocketConnection(io, socket);
    socket.on('STRESS TEST: client event', (timeStampClient) => {
      socket.emit('STRESS TEST: server event', timeStampClient);
    });
  });
}

export default realtime;

export const URL = (input: string) => {
  const output = input
    .toLowerCase()
    .replace('', '/') //insere a barra
    .replace(/ /g, '') //remove espaços, acentos e caracteres especiais
    .replace(/,/g, '')
    .replace(/-/g, '')
    .replace(/á/g, 'a')
    .replace(/ê/g, 'e')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ô/g, 'o');
  return output;
};

export const getTurn = (roomCode: string) => {
  const currentRoom = Store.getInstance().rooms.get(roomCode);
  if (currentRoom) {
    const currentTurn = currentRoom.players.filter(
      (player) => player.currentTurn === true
    );
    if (currentTurn.length > 0) {
      return currentTurn[0].nickname;
    }
    return undefined;
  }
};

export const handleMoving = (
  io: Server,
  roomCode: string,
  destination: string | number
) => {
  const runtimeStorage = Store.getInstance();
  const currentRoom = runtimeStorage.rooms.get(roomCode);
  if (!currentRoom) return;
  if (destination === '/roleta') {
    runtimeStorage.startGameOnRoom(roomCode, 'Roulette', io);
  } else if (destination === '/quembebeu') {
    runtimeStorage.startGameOnRoom(roomCode, 'Quem Bebeu', io);
  } else if (destination === '/saguao') {
    console.log(
      `Sala ${roomCode} - Voltando ao Lobby. Jogo redefinido para null.`
    );
    currentRoom.currentGame = null;
    currentRoom.currentPage = null;
  } else if (typeof destination === 'number') {
    currentRoom.currentPage = destination;
  }
  io.to(roomCode).emit('room-is-moving-to', destination);
};

export const sendPlayerList = (io: Server, roomCode: string) => {
  const runtimeStorage = Store.getInstance();
  const currentRoom = runtimeStorage.rooms.get(roomCode);
  if (currentRoom) {
    const players = currentRoom.players.sort((a, b) =>
      b.beers - a.beers === 0 ? a.playerID - b.playerID : b.beers - a.beers
    );
    io.to(roomCode).emit('lobby-update', JSON.stringify(players));
  }
};
