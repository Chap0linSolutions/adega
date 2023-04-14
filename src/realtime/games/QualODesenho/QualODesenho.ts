import { Server } from 'socket.io';
import Game from '../game';
import { categories } from './words';

type guessingPlayer = {
  id: string;
  nickname: string;
  avatarSeed: string;
  guessTime: string;
  guessedCorrectly: boolean;
};

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
          guessTime: '0',
          guessedCorrectly: false,
        });
      } else {
        this.currentArtist = player.nickname;
      }
    });

    this.log(
      `${this.playerGameData.length} jogadores se encontram neste jogo.\n`
    );
  }

  broadcastGuess(guess: string) {
    this.io.to(this.roomCode).emit('new-guess-attempt', guess);
  }

  updateWinners(payload: string) {
    const [playerName, guessTime] = payload.split(':');

    this.playerGameData.forEach((guessingPlayer) => {
      if (guessingPlayer.nickname === playerName) {
        guessingPlayer.guessedCorrectly =
          parseInt(guessTime) > 0 ? true : false;
        guessingPlayer.guessTime = guessTime;
      }
    });

    const updatedWinners = this.playerGameData.filter(
      (player) => player.guessedCorrectly
    );

    if (updatedWinners) {
      updatedWinners.sort((a, b) => {
        return -(parseFloat(a.guessTime) - parseFloat(b.guessTime));
      });
      this.io
        .to(this.roomCode)
        .emit('updated-winners', JSON.stringify(updatedWinners));

      if (updatedWinners.length === this.playerGameData.length) {
        if (updatedWinners[updatedWinners.length - 1].guessedCorrectly) {
          updatedWinners[updatedWinners.length - 1].guessedCorrectly = false;
        }
        this.io.to(this.roomCode).emit('end-game');
        this.io.to(this.roomCode).emit('final-ranking');
        const finalWinners = <string[]>[];
        updatedWinners.forEach((winner) => {
          if (winner.guessedCorrectly) finalWinners.push(winner.nickname);
        });
        if (finalWinners) finalWinners.push(this.currentArtist);
        this.finish(finalWinners);
      }
    }
  }

  tidyUpRanking() {
    this.playerGameData.forEach((player) => {
      if (!player.guessedCorrectly) {
        this.updateWinners(`${player.nickname}:-1000`);
      }
    });
  }

  finish(winners: string[]) {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    const losers = room?.players.filter(
      (player) => !winners.includes(player.nickname)
    );
    losers && losers.forEach((loser) => (loser.beers += 1));

    this.log(`Jogo encerrado.`);
    this.log(`Quem ganhou: ${winners}`);
    this.log(`Quem bebeu:${losers?.map((loser) => ` ${loser.nickname}`)}`);
  }

  private setWord(word: string) {
    this.word = word;
    this.log(`Palavra "${word}" definida.`);
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

    if (value === 'update-me') {
      const whoAsked = this.runtimeStorage.rooms
        .get(this.roomCode)
        ?.players.find((p) => p.socketID === id);
      this.log(
        `O jogador ${whoAsked?.nickname} chegou no meio do jogo e pediu para ser atualizado.`
      );
      this.io.to(id).emit('game-word-is', this.word);
      return;
    }

    if (value === 'correct-guess') {
      this.updateWinners(payload);
      return;
    }

    if (value === 'wrong-guess') {
      this.broadcastGuess(payload);
      return;
    }

    if (value === 'drawing-points') {
      this.io.to(this.roomCode).emit('drawing-points', payload);
    }

    if (value === 'times-up') {
      this.tidyUpRanking();
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
