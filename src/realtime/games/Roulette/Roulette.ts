import { Server } from 'socket.io';
import Game from '../game';
import { URL, handleMoving } from '../../index'

class Roulette extends Game {
  playerGameData: any;
  gameName = 'SelectNextGame';
  gameType = 'SelectNextGame';

  constructor(io: Server, room: string) {
    super(io, room);
    console.log('Tela de Roleta!');
    this.playerGameData = null;
  }

  handleNextGameSelection() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
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

    const selectedGame = gamesList.findIndex((g) => g === gameDraw);
    room.options.gamesList[selectedGame].counter += 1;
    this.io.to(this.roomCode).emit('roulette-number-is', selectedGame);
    console.log(`Sala ${this.roomCode} - Próximo jogo: ${gameDraw.name}.`);
  }

  handleDisconnect(id: string): void {
    console.log(`Player ${id} disconnected`);
  }
  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'roulette-number-is') {
      return this.handleNextGameSelection();
    } else if(value === 'start-game') {
        console.log(
          `Sala ${this.roomCode} - solicitado o início do jogo ${payload}.`
        );
        this.runtimeStorage.startGameOnRoom(
          this.roomCode,
          payload,
          this.io
        );
        const gameAsURL = URL(payload);
        return handleMoving(this.io, this.roomCode, gameAsURL);
    }
    console.log(
      `Sala ${this.roomCode} - Mensagem recebida: id: ${id}\tvalue: ${value}\tpayload: ${payload}`
    );
  }
}

export { Roulette };
