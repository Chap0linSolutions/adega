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
    console.log('Player disconnected');
  }
  handleMessage(id: any, value: any, payload: any): void {
    console.log('Message received');
  }
}

export { SimpleCardGame };
