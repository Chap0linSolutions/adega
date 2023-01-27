import { Server } from 'socket.io';
import Game from '../Game';

class SimpleCardGame extends Game {
  playerGameData = null; //this game doesn't need player data
  gameType = 'simple';
  gameName = '';

  constructor(io: Server, room: string, game: string) {
    super(io, room);
    this.gameName = game;
  }

  handleDisconnect(id: string): void {
    console.log(`Player ${id} disconnected`);
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'end-game') {
      this.gameName = 'WhoDrank';

      //TODO: implementar uma maneira de manter o ícone do jogo após reconexão
    }
  }
}

export { SimpleCardGame };
