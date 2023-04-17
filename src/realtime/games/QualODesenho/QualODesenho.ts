import { Server } from 'socket.io';
import Game from '../game';
import { categories } from './words';

type guessingPlayer = {
  id: string;
  nickname: string;
  avatarSeed: string;
  guessTime: number;
};

type Winner = {
  nickname: string;
  time: number;
}

class QualODesenho extends Game {
  gameName = 'Qual O Desenho';
  gameType = 'round';
  word: string | undefined;
  playerGameData: guessingPlayer[];
  currentArtist: string;

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.roomCode = room;
    this.word = undefined;
    this.currentArtist = '';
    this.log(`${this.gameName}!`);
    this.log(`Aguardando o jogador da vez selecionar uma palavra.`);
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  getWordSuggestions(num = 2) {
    let suggestionsPool: string[] = [];
    categories.forEach((wordList) => {
      suggestionsPool = suggestionsPool.concat(wordList);
    });

    const suggestions = suggestionsPool
      .sort(() => 0.5 - Math.random())
      .slice(0, num);

    return suggestions;
  }

  sendWordOptions(id: any) {
    const suggestions = this.getWordSuggestions();
    this.io.to(id).emit('que-desenho-suggestions', suggestions);
  }

  setGuessingPlayerList() {
    this.log(`O jogo '${this.gameName}' foi iniciado.`);
    const room = this.runtimeStorage.rooms.get(this.roomCode);

    room?.players.forEach((player) => {
      if (!player.currentTurn) {
        this.playerGameData.push({
          id: player.socketID,
          nickname: player.nickname,
          avatarSeed: player.avatarSeed,
          guessTime: -1,
        });
      } else {
        this.currentArtist = player.nickname;
      }
    });

    this.log(
      `${this.playerGameData.length + 1} pessoas se encontram neste jogo.\n`
    );
  }

  broadcastGuess(guess: string) {
    this.io.to(this.roomCode).emit('new-guess-attempt', guess);
  }

  updateWinners(playerName: string, guessTime: number) {
    this.log(`${playerName} acertou em ${guessTime}`);
    const whoWon = this.playerGameData.find(p => p.nickname === playerName);
    if(!whoWon) return;
    
    whoWon.guessTime = guessTime;
    this.playerGameData.sort((a, b) => (a.guessTime - b.guessTime));
    const winners = this.playerGameData.filter(p => p.guessTime > -1);
    if(winners.length === this.playerGameData.length) return this.finishGame();
    
    return this.io
      .to(this.roomCode)
      .emit('updated-winners', JSON.stringify(winners));
  }

  finishGame() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return this.log('a sala desse jogo não existe mais (wtf?)');
    const losers = this.playerGameData.filter(p => p.guessTime === -1);
    losers && losers.forEach(loser => {
      try{
        let player = room.players.find(p => p.nickname === loser.nickname);
        if(player){
          player.beers += 1;
        } else {
          player = room.disconnectedPlayers.find(p => p.nickname === loser.nickname);
          player && (player.beers += 1);
        }
      } catch (e) {
        this.log(`Não foi possível encontrar o jogador ${loser.nickname}.`)
      }
    })

    this.log(`Jogo encerrado.`);
    this.log(`Quem ganhou: ${this.playerGameData.filter(p => p.guessTime >= 0).map(p => p.nickname)}`);
    this.log(`Quem bebeu: ${losers?.map((loser) => loser.nickname)}`);
    this.io
      .to(this.roomCode)
      .emit('results', JSON.stringify(this.playerGameData));
  }

  private setWord(word: string) {
    this.word = word;
    this.log(`Palavra '${word}' definida.`);
    this.io.to(this.roomCode).emit('game-word-is', word);
    return true;
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'que-desenho-suggestions') {
      this.sendWordOptions(id);
      this.setGuessingPlayerList();
      return;
    }

    if (value === 'game-word-is') {
      this.setWord(payload);
      return;
    }

    if (value === 'start-game') {
      this.io.to(this.roomCode).emit('start-game');
      return;
    }

    if (value === 'correct-guess') {
      const { nickname, time }: Winner = JSON.parse(payload);
      this.updateWinners(nickname, time);
      return;
    }

    if (value === 'drawing-points') {
      this.io.to(this.roomCode).emit('drawing-points', payload);
    }

    if (value === 'times-up') {
      this.finishGame();
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

export { QualODesenho };
