import { Server } from 'socket.io';
import Game from '../game';
import { categorias } from './names';

type whoPlayer = {
  player: string;
  whoPlayerIs: string;
  disconnected: boolean;
};

class QuemSouEu extends Game {
  gameName = 'Quem Sou Eu';
  gameType = 'round';
  category: string | undefined;
  playerGameData: whoPlayer[];
  names: string[] | undefined;

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.names = undefined;
    this.roomCode = room;
    this.category = undefined;
    this.log(`${this.gameName}!`);
    this.log(`Aguardando os jogadores selecionarem uma categoria.`);
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  sendActivePlayers() {
    const activePlayers = this.playerGameData.filter((p) => !p.disconnected);
    this.io
      .to(this.roomCode)
      .emit('players-and-names-are', JSON.stringify(activePlayers));
    this.log('Jogadores ativos:');
    console.log(
      activePlayers.map((p) => ({
        player: p.player,
        whoPlayerIs: p.whoPlayerIs,
      }))
    );
  }

  updateNames() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    room &&
      room.players.forEach((player) => {
        this.pickNameFor(player.nickname);
      });
    this.sendActivePlayers();
  }

  getNewNameFor(playerName: string) {
    if (!this.names) return;
    const namesInUse = this.playerGameData.map((p) => p.whoPlayerIs);
    const availableNames = this.names.filter(
      (name) => !namesInUse.includes(name)
    );
    const index = this.playerGameData.findIndex((p) => p.player === playerName);

    this.playerGameData[index] = {
      ...this.playerGameData[index],
      whoPlayerIs:
        availableNames[Math.floor(availableNames.length * Math.random())],
    };

    this.sendActivePlayers();
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

  private setCategory(name: string) {
    this.category = name;
    this.names = categorias.get(name);
    if (this.names) {
      this.log(`Categoria "${name}" definida.`);
      this.io.to(this.roomCode).emit('game-category-is', name);
      return true;
    }
    this.log(`Erro! A categoria "${name}" não existe.`);
    return false;
  }

  private pickNameFor(playerName: string) {
    if (this.names) {
      if (this.playerGameData.map((p) => p.player).includes(playerName)) {
        this.log(
          `Sala ${this.roomCode} - O jogador "${playerName}" já possui um nome.`
        );
        const player = this.playerGameData.find((p) => p.player === playerName);
        player && (player.disconnected = false);
        return;
      }

      const namesInUse = this.playerGameData.map((p) => p.whoPlayerIs);
      const availableNames = this.names.filter(
        (name) => !namesInUse.includes(name)
      );

      this.playerGameData.push({
        player: playerName,
        whoPlayerIs:
          availableNames[Math.floor(availableNames.length * Math.random())],
        disconnected: false,
      });
    }
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'game-category-is') {
      this.setCategory(payload) && this.updateNames();
      return;
    }

    if (value === 'send-me-a-new-name') {
      const whoAsked = this.runtimeStorage.rooms
        .get(this.roomCode)
        ?.players.find((p) => p.socketID === id);

      if (!whoAsked) return;
      this.log(`O jogador ${whoAsked?.nickname} pediu para trocar de nome.`);
      this.getNewNameFor(whoAsked.nickname);
    }

    if (value === 'update-me') {
      const whoAsked = this.runtimeStorage.rooms
        .get(this.roomCode)
        ?.players.find((p) => p.socketID === id);
      this.log(
        `O jogador ${whoAsked?.nickname} chegou no meio do jogo e pediu para ser atualizado.`
      );
      this.io.to(id).emit('game-category-is', this.category);
      this.updateNames();
    }

    if (value === 'winners-are') {
      const winners = JSON.parse(payload);
      this.finish(winners);
      this.io.to(this.roomCode).emit('winners-are', payload);
      return;
    }
  }

  handleDisconnect(id: string): void {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    const whoLeft = room?.disconnectedPlayers.find(
      (p) => p.socketID === id
    )?.nickname;
    this.log(`${whoLeft} saiu do jogo.`);
    const player = this.playerGameData.find((p) => p.player === whoLeft);
    player && (player.disconnected = true);
    this.sendActivePlayers();
  }
}

export { QuemSouEu };
