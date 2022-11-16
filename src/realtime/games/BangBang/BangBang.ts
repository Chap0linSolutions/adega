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

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
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
      .get(this.runningOnRoom)
      ?.players.find((p: player) => {
        return p.socketID === id;
      });

    if (player) {
      this.numberOfPlayers += 1;

      // TODO: have playerGameData be a copy of room.players initialised at the constructor
      this.playerGameData.push({
        id: player.socketID,
        nickname: player.nickname,
        seed: player.avatarSeed,
        shotTime: 0,
      });
    }

    const playersOnRoom = this.runtimeStorage.rooms.get(this.runningOnRoom)
      ?.players.length;
    if (this.numberOfPlayers === playersOnRoom) {
      console.log(`Current number of players in game: ${this.numberOfPlayers}`);
      console.log(`About to start timer on room ${this.runningOnRoom}`);
      this.io
        .to(this.runningOnRoom)
        .emit('message', { message: 'start_timer' });
    }
  }

  // Gameplay
  handleShot(id: string, payload: any) {
    console.log(this.runtimeStorage.allPlayers);
    console.log(id);
    const player = this.playerGameData.find((p: bangbangData) => p.id === id);

    if (player) {
      player.shotTime = payload.time;
      console.log(`Player ${player.id}'s time: ${player.shotTime}`);

      const hasFired = this.playerGameData
        .map((p: bangbangData) => !!p.shotTime)
        .reduce((ac: any, at: any) => ac && at);
      console.log(hasFired);
      if (hasFired) {
        const winnerID = this.playerGameData.sort(
          (a: bangbangData, b: bangbangData) => b.shotTime - a.shotTime
        )[0].id;
        this.io
          .to(this.runningOnRoom)
          .emit('message', { message: 'bangbang_result', id: winnerID });

        this.playerGameData = [];
        this.numberOfPlayers = 0;
      }
    }
  }
}

export { BangBang };
