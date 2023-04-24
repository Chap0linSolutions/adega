import Game from '../game';
import { Server } from 'socket.io';
import { categorias } from './names';
import { handleMoving } from '../..';

type Suggestion = {
  category: string,
  word: string,
}

class MestreDaMimica extends Game {
  gameName = 'Mestre da Mímica';
  gameType = 'round';
  playerGameData: string[];

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.roomCode = room;
    this.log(`${this.gameName}!`);
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  finish(winners: string[]) {
  }


  handleMessage(id: any, value: any, payload: any): void {
    if(value === 'mimic-suggestions'){

      const suggestions:Suggestion[] = [
        {category: 'personagem', word: 'Detona Ralph'},
        {category: 'objeto', word: 'Martelo'},
        {category: 'animal', word: 'Tubarão'},
      ]
      this.io.to(this.roomCode).emit('mimic-suggestions', JSON.stringify(suggestions));
      return;
    }

    if(value === 'mimic-state-is'){
      this.io.to(this.roomCode).emit('mimic-state-is', payload);
    }

    if(value === 'names-so-far'){
      this.io.to(this.roomCode).emit('names-so-far', payload);
      return;
    }

    if(value === 'game-results-are'){
      this.io.to(this.roomCode).emit('game-results-are', payload);
      return;
    }
  }

  handleDisconnect(id: string): void {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    const whoLeft = room?.disconnectedPlayers.find(
      (p) => p.socketID === id
    )?.nickname;
    this.log(`${whoLeft} saiu do jogo.`);
  }
}

export { MestreDaMimica };
