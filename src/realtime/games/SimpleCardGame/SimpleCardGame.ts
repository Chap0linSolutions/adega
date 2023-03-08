import { Server } from 'socket.io';
import { handleMoving } from '../../index';
import { player } from '../../store';
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
    // if(value === 'can-I-come-in'){
    //   const {nickname, avatarSeed} = JSON.parse(payload);
    //   const playerCanCome = this.playerGameData?.find(p => p.nickname === nickname && p.avatarSeed === avatarSeed);
    //   if(playerCanCome){
    //     this.log(`O jogador ${nickname} pode entrar.`);
    //     this.io.to(id).emit('you-can-come', JSON.stringify({
    //       URL: '/WhoDrank',
    //       state: undefined,
    //     }));
    //   } else {
    //     this.log(`O jogador ${nickname} deve esperar a rodada acabar no Lobby.`);
    //   } return;
    // }
    if(value === 'end-game'){
      if(this.gameName === 'Who Drank'){
        return handleMoving(this.io, this.roomCode, '/SelectNextGame');
      }
      return handleMoving(this.io, this.roomCode, '/WhoDrank');
    }
  }
}

export { SimpleCardGame };
