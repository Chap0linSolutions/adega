import { Server } from 'socket.io';
import Game from '../game';

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

  handleMessage(id: any, value: any): void {
    if (value === 'end-game') {
      this.gameName = 'WhoDrank';
    }
  }
}

export { SimpleCardGame };
