import { handleMoving } from '../../index';
import { Server } from 'socket.io';
import Game from '../game';

type titanicSession = {
  nickname: string;
  avatarSeed: string;
  shipPlacement: number[] | undefined;
  hits: number;
};

const Status = {
  TimesUp: -100,
  TitanicTimesUp: [-100],
  IcebergTimesUp: [-100, -100, -100, -100, -100],
  IcebergLeftAlone: [-200, -200, -200, -200, -200],
  Disconnected: [-1],
};

class Titanic extends Game {
  gameName = 'Titanic';
  gameType = 'round';
  playerGameData: titanicSession[];

  constructor(io: Server, room: string) {
    super(io, room);
    this.roomCode = room;
    this.log('Titanic!');
    this.playerGameData = [];
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ` + message);
  }

  beginGame() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;
    room.players.forEach((player) =>
      this.playerGameData.push({
        nickname: player.nickname,
        avatarSeed: player.avatarSeed,
        shipPlacement: undefined,
        hits: 0,
      })
    );

    this.log(
      `O jogo Titanic foi iniciado. Os dados dos jogadores foram zerados.`
    );
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'move-to') {
      this.beginGame();
      return handleMoving(this.io, this.roomCode, payload);
    }
    if (value === 'player-has-selected') {
      const room = this.runtimeStorage.rooms.get(this.roomCode);
      if(!room) return;
      
      const playerName = room.players
        .filter((p) => p.socketID === id)
        .at(0)?.nickname;

      if (playerName) {
        const parsedPayload: number[] = JSON.parse(payload);
        const sectors = parsedPayload.map((p) => (p > 0 ? p - 100 : p));
        const player = this.playerGameData.find((p) => p.nickname === playerName);
        if(!player) return;
        player.shipPlacement = sectors;
        this.checkForGameConclusion();
      }
    }
  }

  checkForGameConclusion() {
    if (
      this.playerGameData.filter((p) => p.shipPlacement === undefined)
        .length === 0
    ) {
      this.log(`Jogo encerrado.`);
      this.finishGame();
    } else if (
      this.playerGameData.filter(
        (p) => p.shipPlacement && p.shipPlacement[0] === Status.Disconnected[0]
      ).length ===
      this.playerGameData.length - 1
    ) {
      this.log('Só sobrou o jogador da vez.');

      const icePlayer = this.playerGameData.find((p) => p.shipPlacement === undefined);
      if(!icePlayer) return;
      icePlayer.shipPlacement = Status.IcebergLeftAlone;
      this.finishGame();
    }
  }

  finishGame() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(!room) return;
    const whoPlayed = this.playerGameData.filter(
      (p) => p.shipPlacement && p.shipPlacement.length > 1
    );
    const whoDidnt = this.playerGameData.filter(
      (p) => p.shipPlacement && p.shipPlacement[0] === Status.TimesUp
    );
    const icebergPlayer = this.playerGameData
    .find((p) => p.shipPlacement && p.shipPlacement.length > 3);
    
    if(!icebergPlayer || !icebergPlayer.shipPlacement) return;
    
    let icebergPlayerGotSomeone = false;
    const icebergPlayerWasTheOnlyOneLeft =
      icebergPlayer.shipPlacement[0] === Status.IcebergLeftAlone[0];

    if (icebergPlayer) {
      whoPlayed.forEach((player) => {
        player.shipPlacement?.forEach((place) => {
          if (icebergPlayer.shipPlacement?.includes(place)) {
            player.hits += 1;
            if (
              !icebergPlayerGotSomeone &&
              player.nickname !== icebergPlayer.nickname
            ) {
              icebergPlayerGotSomeone = true;
            }
          }
        });
      });
    }

    let survivors = 0;
    whoPlayed.forEach((player) => {
      if (player.hits > 0 && player.hits < 5) {
        this.log(`${player.nickname} bebe (foi atingido(a)).`);
        try {
          const pl = room.players.find((p) => p.nickname === player.nickname);
          if(pl) pl.beers += 1;
        } catch (e) {
          const pl = room.disconnectedPlayers.find((p) => p.nickname === player.nickname);
          if(pl) pl.beers += 1;
        }
      } else if (player.hits === 0) {
        this.log(`${player.nickname} sobreviveu.`);
        survivors += 1;
      }
    });

    whoDidnt.forEach((player) => {
      this.log(`${player.nickname} bebe (não jogou a tempo).`);
      try {
        const pl = room.players.find((p) => p.nickname === player.nickname);
        if(pl) pl.beers += 1;
      } catch (e) {
        const pl = room.disconnectedPlayers.find((p) => p.nickname === player.nickname);
        if(pl) pl.beers += 1;
      }
    });

    if (
      !icebergPlayerWasTheOnlyOneLeft &&
      !icebergPlayerGotSomeone &&
      survivors > 0
    ) {
      this.log(
        `${icebergPlayer.nickname} jogou com seus icebergs, mas é MUITO ruim e não acertou ninguém. Por isso bebe.`
      );
      const icePlayer = room.players.find((p) => p.nickname === icebergPlayer.nickname);
      if(icePlayer) icePlayer.beers += 1;
    }

    const finalResults = this.playerGameData.map((player) => {
      //wrap up the results
      return {
        nickname: player.nickname,
        avatarSeed: player.avatarSeed,
        shipPlacement: player.shipPlacement,
        hits: player.hits,
      };
    });

    this.log(`Enviando resultados aos jogadores.`); //send final results
    this.io
      .to(this.roomCode)
      .emit('titanic-results', JSON.stringify(finalResults));
  }

  handleDisconnect(id: string): void {
    if (this.playerGameData.length > 0) {
      const room = this.runtimeStorage.rooms.get(this.roomCode);
      if(!room) return;

      const whoLeft = room.disconnectedPlayers.filter((p) => p.socketID === id);

      this.log(
        `O jogador ${whoLeft[0].nickname} desconectou-se e não poderá mais participar desta rodada.`
      );
      const whoLeftIndex = this.playerGameData.findIndex(
        (p) => p.nickname === whoLeft[0].nickname
      );
      if (this.playerGameData[whoLeftIndex].shipPlacement === undefined) {
        this.playerGameData[whoLeftIndex].shipPlacement = Status.Disconnected;
      }
      this.checkForGameConclusion();
    }
  }
}

export { Titanic };
