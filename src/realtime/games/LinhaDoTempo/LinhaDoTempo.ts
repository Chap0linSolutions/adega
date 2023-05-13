import { Server } from 'socket.io';
import Game from '../game';
import { handleMoving } from '../..';

class LinhaDoTempo extends Game {
  gameName = 'Linha do tempo';
  gameType = 'round';
  playerGameData: any[];

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.roomCode = room;
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  getPhraseAndOptions(){
    return {
      phrase: 'Em que ano foi inventada a lâmpada incandescente?',
      options: ['1840', '1850', '1860', '1870'],
    }
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'phrase-and-options') {
      const answer = this.getPhraseAndOptions();
      this.io.to(this.roomCode).emit('phrase-and-options', JSON.stringify(answer));
    }
    if (value === 'move-to') {
      handleMoving(this.io, this.roomCode, payload);
    }
  }


  handleDisconnect(id: string): void {
    const disconnectedPlayers = this.runtimeStorage.rooms.get(
      this.roomCode
    )?.disconnectedPlayers;
    const disconnectedPlayerName = disconnectedPlayers?.find(
      (p) => p.socketID === id
    )?.nickname;

    this.log(`O jogador ${disconnectedPlayerName} saiu.`);
  }
}

export { LinhaDoTempo };
