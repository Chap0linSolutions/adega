import { Server } from 'socket.io';
import Game from '../game';
import { handleMoving } from '../..';
import { player } from '../../store';

type gameData = {
  player: player,
  guess: string | number | undefined,
}

type Results = {
  answer: string | number,
  guesses: {
    player: string,
    guess: string | number | undefined,
  }[]
}

enum Status {
  DISCONNECTED = -1,
  TIMESUP = -100,
}

class LinhaDoTempo extends Game {
  gameName = 'Linha do tempo';
  gameType = 'round';
  playerGameData: gameData[];
  hasSentResults: boolean;

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.roomCode = room;
    this.hasSentResults = false;
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  begin(){
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;

    this.playerGameData = room.players.map(p => ({
      player: p,
      guess: undefined,
    }));

    this.log(`Jogo iniciado. ${this.playerGameData.length} pessoas estão jogando.`)
  }

  handleGuess(name: string, guess: string | number){
    const who = this.playerGameData
      .filter(p => p.guess !== -1)
      .find(p => p.player.nickname === name);

    if(!who) return this.log(`O jogador ${name} não está no jogo.`);
    who.guess = guess;
    this.log(`Chute do jogador ${who.player.nickname}: ${who.guess}`);
    this.checkForGameConclusion();
  }

  checkForGameConclusion(){
    const whosLeft = this.playerGameData.filter(p => !p.guess);
    if(whosLeft.length > 0) return this.log(`Ainda restam ${whosLeft.length} jogadores.`);
    this.finish();
  }

  timesUp(){
    this.playerGameData.forEach(p => {
      if(!p.guess){
        p.guess = Status.TIMESUP;
      }
    })

    const whoMissed = this.playerGameData.filter(p => p.guess === Status.TIMESUP);
    if(whoMissed.length > 0) this.log(
      `Os seguintes jogadores não jogaram a tempo: ${whoMissed.map(w => w.player.nickname)}`
    ); this.log('Acabou o tempo!');
    this.finish();
  }

  finish(){
    const answer: Results = {
      answer: '1850',
      guesses: this.playerGameData.map(p => ({
        player: p.player.nickname,
        guess: p.guess,
      }))
    }
    this.io.to(this.roomCode).emit('results', JSON.stringify(answer));
    this.hasSentResults = true;
  }

  getPhraseAndOptions(){
    return {
      phrase: 'EM QUE ANO... foi inventada a lâmpada incandescente?',
      options: ['1840', '1850', '1860', '1870'],
    }
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'phrase-and-options') {
      const answer = this.getPhraseAndOptions();
      this.io.to(this.roomCode).emit('phrase-and-options', JSON.stringify(answer));
      return;
    }
    if (value === 'start-game') {
      this.begin();
      return handleMoving(this.io, this.roomCode, payload);
    }
    if (value === 'my-guess-is'){
      const {player, guess} = JSON.parse(payload); 
      return this.handleGuess(player, guess);
    }
    if (value === 'times-up'){
      return this.timesUp();
    }
  }


  handleDisconnect(id: string): void {
    if(this.hasSentResults) return;
    const disconnectedPlayers = this.runtimeStorage.rooms.get(
      this.roomCode
    )?.disconnectedPlayers;
    const disconnectedPlayerName = disconnectedPlayers?.find(
      (p) => p.socketID === id
    )?.nickname;

    const thisGamePlayer = this.playerGameData.filter(p => p.player.nickname === disconnectedPlayerName);
    if(!thisGamePlayer) return;

    this.log(`O jogador ${thisGamePlayer[0].player.nickname} desconectou-se e não poderá mais jogar nesta rodada.`);
    thisGamePlayer[0].guess = Status.DISCONNECTED;
    this.checkForGameConclusion();
  }
}

export { LinhaDoTempo };
