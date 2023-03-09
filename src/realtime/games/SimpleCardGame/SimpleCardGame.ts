import { Server } from 'socket.io';
import { handleMoving } from '../../index';
import Game from '../game';

type SimpleCardPlayer = {
  nickname: string,
  avatarSeed: string,
}
class SimpleCardGame extends Game {
  playerGameData: SimpleCardPlayer[] | null;
  gameType = 'simple';
  gameName = '';

  constructor(io: Server, room: string, game: string) {
    super(io, room);
    this.gameName = game;
    this.playerGameData = null;
    this.begin();
  }

  log(message: string){
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  begin(){
    console.log(`${this.gameName}!`);
    if(this.gameName === 'Who Drank'){
      const room = this.runtimeStorage.rooms.get(this.roomCode);
      this.playerGameData = room!.players.map(p => {
        return {
          nickname: p.nickname,
          avatarSeed: p.avatarSeed,
        }
      });
    }
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
