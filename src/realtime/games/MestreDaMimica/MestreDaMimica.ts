import Game from '../game';
import { Server } from 'socket.io';
import { categories } from './names';
import { player } from '../../store';
import { handleMoving } from '../../index';

class MestreDaMimica extends Game {
  gameName = 'Mestre da Mímica';
  gameType = 'round';
  playerGameData: player[];

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.roomCode = room;
    this.log(`${this.gameName}!`);
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  getWordSuggestions() {
    let names: string[] = [];
    categories.forEach((content) => names = [...names, ...content]);
    names.sort(() => 0.5 - Math.random());
    return [names[0], names[1], names[2]];
  }

  begin(gameRoom: number) {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;
    this.log('O jogo foi iniciado. Enviando sugestões...');
    this.playerGameData = [...room.players];
    const suggestions: string[] = this.getWordSuggestions();
    console.log(suggestions);
    this.io.to(this.roomCode).emit('mimic-suggestions', JSON.stringify(suggestions));
    return handleMoving(this.io, this.roomCode, gameRoom);
  }

  finish(correctGuesses: string[]) {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;
    this.log(`Jogo encerrado. Nomes acertados: ${correctGuesses.length}`);
  
    const drinkAmount = 2 - correctGuesses.length;

    room.players.forEach(p => {
      p.beers += (drinkAmount >= 0)? drinkAmount : 0;
    })
    room.disconnectedPlayers.forEach(p => {
      p.beers += (drinkAmount >= 0)? drinkAmount : 0;
    })
    this.io.to(this.roomCode).emit('game-results-are', correctGuesses);
  }


  handleMessage(id: any, value: any, payload: any): void {
    if(value === 'mimic-suggestions'){
      this.begin(payload);
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
      this.finish(payload);
      return;
    }
  }

  handleDisconnect(id: string): void {
    const index = this.playerGameData.findIndex(p => p.nickname === id);
    this.log(`O jogador de ID de socket ${id} desconectou-se e não poderá mais participar desta rodada.`)
    if(index > -1) {
      this.playerGameData.splice(index, 1);
    }
  }
}

export { MestreDaMimica };
