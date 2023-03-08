import { Server } from 'socket.io';
import { handleMoving } from '../../index';
import Game from '../game';

class SimpleCardGame extends Game {
  playerGameData = null; //this game doesn't need player data
  gameType = 'simple';
  gameName = '';

  constructor(io: Server, room: string, game: string) {
    super(io, room);
    this.gameName = game;
    this.begin();
  }

  begin(){
    console.log(`${this.gameName}!`);
  }

  handleDisconnect(id: string): void {
    console.log(`Player ${id} disconnected`);
  }

  handleMessage(id: any, value: any, payload: any): void {
    if(value === 'end-game'){
      if(this.gameName === 'Who Drank'){
        return handleMoving(this.io, this.roomCode, '/SelectNextGame');
      }
      return handleMoving(this.io, this.roomCode, '/WhoDrank');
    }
  }
}

export { SimpleCardGame };
