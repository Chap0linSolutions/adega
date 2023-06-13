import { Server } from 'socket.io';
import Game from '../game';
import { handleMoving } from '../../index';
import { questions } from './questions';

type gameData = {
  nickname: string,
  guess: number | undefined,
}

type Results = {
  answer: number,
  guesses: {
    player: string,
    guess: number | undefined,
  }[]
}

enum Status {
  DISCONNECTED = -1,
  TIMESUP = -100,
}

class LinhaDoTempo extends Game {
  gameName = 'Linha do Tempo';
  gameType = 'round';
  playerGameData: gameData[];
  hasSentResults: boolean;
  question: string | undefined;
  answer: number | undefined;

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.roomCode = room;
    this.hasSentResults = false;
    this.question = undefined;
    this.answer = undefined;
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  begin(){
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;

    this.playerGameData = room.players.map(p => ({
      nickname: p.nickname,
      guess: undefined,
    }));

    this.log(`Jogo iniciado. ${this.playerGameData.length} pessoas estão jogando.`);
  }

  handleGuess(name: string, guess: number){
    const who = this.playerGameData
      .filter(p => p.guess !== -1)
      .find(p => p.nickname === name);

    if(!who) return this.log(`O jogador ${name} não está no jogo.`);
    who.guess = guess;
    this.log(`Chute do jogador ${who.nickname}: ${who.guess}`);
    this.checkForGameConclusion();
  }

  checkForGameConclusion(){
    const whosLeft = this.playerGameData.filter(p => !p.guess);
    if(whosLeft.length > 0) return this.log(`Ainda restam ${whosLeft.length} jogadores.`);
    this.finish();
  }

  finish(){
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    const ans = this.answer;
    if(!room || !ans) return;

    const orderedGuesses = this.playerGameData
      .filter(p => p.guess !== Status.DISCONNECTED)
      .map(p => ((p.guess)                                            //por algum motivo ele acha que p.guess pode ser undefined aqui (o que é impossível neste ponto do código). O condicional contorna isso.
        ? {...p, diff: Math.abs(p.guess - ans)}
        : {...p, diff: 100000}                                        //esse resultado nunca deve acontecer, isso só está aqui por causa do lint 
      ))                                                 
      .sort((a, b) => a.diff - b.diff);
    console.log(`Sala ${this.roomCode} - chutes:`, orderedGuesses);

    if(orderedGuesses.length === 0) return;
    const whoDrinks = orderedGuesses.filter(p => p.diff !== orderedGuesses[0].diff);
    const drinkAmount = (orderedGuesses[0].diff === 0)? 2 : 1;

    whoDrinks.forEach(p => {
      const player = room.players.find(pl => pl.nickname === p.nickname);
      if(player){
        player.beers += drinkAmount;
      } else {
        const disconnectedPlayer = room.disconnectedPlayers.find(pl => pl.nickname === p.nickname);
        if(disconnectedPlayer){
          disconnectedPlayer.beers += drinkAmount;
        } else {
          this.log(`O jogador ${p.nickname} não está nem conectado nem desconectado da partida (wtf?)`);
        }
      }
    });

    const results: Results = {
      answer: ans,
      guesses: this.playerGameData.map(p => ({
        player: p.nickname,
        guess: p.guess,
      }))
    }

    this.io.to(this.roomCode).emit('results', JSON.stringify(results));
    this.hasSentResults = true;
  }

  getQuestion(){
    if(this.question || this.answer) return;
    const question = questions.sort(() => 0.5 - Math.random()).at(0);
    this.question = question?.q;
    this.answer = question?.a;
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'question-is') {
      this.getQuestion();
      this.io.to(this.roomCode).emit('question-is', this.question);
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
  }


  handleDisconnect(id: string): void {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;
    if(this.hasSentResults) return;

    try {
      const disconnectedPlayerName = room.disconnectedPlayers.find(
        (p) => p.socketID === id
      )?.nickname;
    
      const thisGamePlayer = this.playerGameData.filter(p => p.nickname === disconnectedPlayerName);
      if(thisGamePlayer.length === 0) return;

      this.log(`O jogador ${thisGamePlayer[0].nickname} desconectou-se e não poderá mais jogar nesta rodada.`);
      thisGamePlayer[0].guess = Status.DISCONNECTED;
      this.checkForGameConclusion();
    } catch (e) {
      console.log(e);
    }
  }
}

export { LinhaDoTempo };
