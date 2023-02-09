import { Server } from 'socket.io';
import Game from '../game';
import { player } from '../../store';

type bangbangData = {
  id: string;
  nickname: string;
  seed: string;
  shotTime: number;
};

class BangBang extends Game {
  playerGameData: bangbangData[];
  numberOfPlayers = 0;
  gameName = 'Bang Bang';
  gameType = 'round';

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    console.log('Bang Bang!');
  }

  handleMessage(id: any, value: any, payload: any) {
    if (value === 'player_ready') {
      this.startGame(id);
    }

    if (value === 'shot') {
      console.log('Shots fired');
      this.handleShot(id, payload);
    }
  }

  // Add players and Start game
  public startGame(id: any) {
    const player = this.runtimeStorage.rooms
      .get(this.roomCode)
      ?.players.find((p: player) => {
        return p.socketID === id;
      });

    if (!player) return;
    this.numberOfPlayers += 1;

    // TODO: have playerGameData be a copy of room.players initialised at the constructor
    this.playerGameData.push({
      id: player.socketID,
      nickname: player.nickname,
      seed: player.avatarSeed,
      shotTime: 0,
    });

    const playersOnRoom = this.runtimeStorage.rooms.get(this.roomCode)?.players
      .length;
    if (this.numberOfPlayers === playersOnRoom) {
      this.io.to(this.roomCode).emit('message', { message: 'start_timer' });
    }
  }

  // Gameplay
  handleShot(id: string, payload: any) {
    const player = this.playerGameData.find((p: bangbangData) => p.id === id);

    if (player) {
      player.shotTime = payload.time;

      const playersRanking = this.playerGameData
        .filter((p) => !!p.shotTime)
        .sort((a: bangbangData, b: bangbangData) => b.shotTime - a.shotTime);

      this.io.to(this.roomCode).emit('message', {
        message: 'bangbang_result',
        ranking: playersRanking,
      });

      const hasFired = this.playerGameData
        .map((p: bangbangData) => !!p.shotTime)
        .reduce((ac: any, at: any) => ac && at);

      console.log(hasFired);

      if (hasFired) {
        this.io.to(this.roomCode).emit('message', {
          message: 'bangbang_ranking',
          ranking: playersRanking,
        });

        this.addBeers(playersRanking);
        this.playerGameData = [];
        this.numberOfPlayers = 0;
      }
    }
  }

  handleDisconnect(id: string): void {
    const index = this.playerGameData.findIndex((p) => p.id === id);
    this.playerGameData.splice(index, 1);
    if (this.playerGameData.length === 0) return;

    const hasFired = this.playerGameData
      .map((p: bangbangData) => !!p.shotTime)
      .reduce((ac: any, at: any) => ac && at);

    console.log(hasFired);
    if (hasFired) {
      const playersRanking = this.playerGameData.sort(
        (a: bangbangData, b: bangbangData) => b.shotTime - a.shotTime
      );

      this.io.to(this.roomCode).emit('message', {
        message: 'bangbang_ranking',
        ranking: playersRanking,
      });

      this.playerGameData = [];
      this.numberOfPlayers = 0;
    } else {
      this.numberOfPlayers -= 1;
    }
  }

  addBeers(playersRanking: bangbangData[]) {
    console.log('Acabou o tempo! Computando perdedor(es)...');
    let slowestPlayers = [];

    if (playersRanking[this.numberOfPlayers - 1].shotTime > -10000) {
      slowestPlayers.push(playersRanking[this.numberOfPlayers - 1]);
    } else {
      slowestPlayers = playersRanking.filter(
        (player) => player.shotTime <= -10000
      );
    }

    slowestPlayers.forEach((slowestPlayer) => {
      this.runtimeStorage?.rooms
        .get(this.roomCode)
        ?.players.forEach((player) => {
          if (player.nickname === slowestPlayer.nickname) {
            player.beers += 1;
          }
        });
    });
  }
}

export { BangBang };
