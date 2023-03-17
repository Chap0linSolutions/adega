import { Server } from 'socket.io';
import Game from '../game';
import { URL, handleMoving, getTurn } from '../../index';

class Roulette extends Game {
  playerGameData: any;
  gameName = 'SelectNextGame';
  gameType = 'SelectNextGame';
  hasSelectedNextGame: boolean;

  constructor(io: Server, room: string) {
    super(io, room);
    this.log('Tela de Roleta!');
    this.playerGameData = null;
    this.hasSelectedNextGame = false;
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  handleNextGameSelection() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if (!room) return;

    if (!room.options.gamesList.find((game) => game.counter === 0)) {
      this.log('Todos os jogos possíveis com contador > 0.');
      room.options.gamesList.forEach((game) => (game.counter -= 1));
    }

    const gamesList = room.options.gamesList;
    const drawableOptions = gamesList
      .filter((game) => game.name !== room.lastGameName)
      .filter((game) => game.counter < 4);
    const gameDrawIndex = Math.floor(Math.random() * drawableOptions.length);
    const gameDraw = drawableOptions[gameDrawIndex];
    room.lastGameName = gameDraw.name;

    const selectedGame = gamesList.findIndex((g) => g === gameDraw);
    room.options.gamesList[selectedGame].counter += 1;
    this.io.to(this.roomCode).emit('roulette-number-is', selectedGame);
    this.log(`Próximo jogo: ${gameDraw.name}.`);
    this.hasSelectedNextGame = true;
  }

  setInitialTurn = (roomCode: string) => {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    const currentOwner = currentRoom?.players.find(
      (player) => player.socketID === currentRoom.ownerId
    );
    if (currentOwner) currentOwner.currentTurn = true;
  };

  handleDisconnect(id: string): void {
    this.log(`Player ${id} disconnected`);
  }

  checkWhoseTurnIsThis() {
    let currentTurnName = getTurn(this.roomCode);
    if (currentTurnName === undefined) {
      this.log('Current turn not found! Setting owner as next player!');
      this.setInitialTurn(this.roomCode);
      currentTurnName = getTurn(this.roomCode);
    }
    this.io.to(this.roomCode).emit('player-turn-is', currentTurnName);
  }

  startGame(payload: any) {
    this.log(`Solicitado o início do jogo ${payload}.`);
    this.runtimeStorage.startGameOnRoom(this.roomCode, payload, this.io);
    const gameAsURL = URL(payload);
    return handleMoving(this.io, this.roomCode, gameAsURL);
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'player-turn-is') {
      return this.checkWhoseTurnIsThis();
    }
    if (this.hasSelectedNextGame && value === 'start-game') {
      return this.startGame(payload);
    }
    if (value === 'roulette-number-is') {
      return this.handleNextGameSelection();
    }
  }
}

export { Roulette };
