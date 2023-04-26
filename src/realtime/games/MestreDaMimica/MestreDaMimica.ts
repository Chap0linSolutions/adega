import Game from '../game';
import { Server } from 'socket.io';
import { categories } from './names';
import { player } from '../../store';
import { handleMoving } from '../../index';

type Suggestion = {
  category: string,
  word: string,
}

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
    const names: string[] = [];
    categories.forEach((content, category) => names.push(category));
    names.sort(() => 0.5 - Math.random());
    const option1 = categories.get(names[0])?.sort(() => 0.5 - Math.random())[0];
    const option2 = categories.get(names[1])?.sort(() => 0.5 - Math.random())[0];
    const option3 = categories.get(names[2])?.sort(() => 0.5 - Math.random())[0];
    
    const results: Suggestion[] = [
      {category: names[0], word: option1 as string},
      {category: names[1], word: option2 as string},
      {category: names[2], word: option3 as string},
    ];

    return results;
  }

  begin(gameRoom: number) {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;
    this.log('O jogo foi iniciado. Enviando sugestões...');
    this.playerGameData = [...room.players];
    const suggestions: Suggestion[] = this.getWordSuggestions();
    this.io.to(this.roomCode).emit('mimic-suggestions', JSON.stringify(suggestions));
    return handleMoving(this.io, this.roomCode, gameRoom);
  }

  finish(correctGuesses: Suggestion[]) {
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
