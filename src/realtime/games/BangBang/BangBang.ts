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
  expectedShots: number;
  numberOfShots: number;

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.numberOfShots = 0;
    this.expectedShots = this.runtimeStorage.rooms.get(room)!.players.length;
    console.log('Bang Bang!');
  }

  handleMessage(id: any, value: any, payload: any) {
    if (value === 'player_ready') {
      console.log('Player ready');
      this.startGame(id);
    }

    if (value === 'shot') {
      console.log('Shots fired');
      this.numberOfShots += 1;
      if (this.numberOfShots === this.expectedShots) {
        console.log('Game finished! Updating turn...');
        this.updateTurn(this.roomCode);
        this.io
          .to(this.roomCode)
          .emit(
            'player-turn',
            this.runtimeStorage.rooms
              .get(this.roomCode)
              ?.players.find((player) => player.currentTurn === true)?.socketID
          );
      }
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
    console.log(`Players on room: ${playersOnRoom}`);
    console.log(`Numbers of players: ${this.numberOfPlayers}`);
    if (this.numberOfPlayers === playersOnRoom) {
      console.log(`Current number of players in game: ${this.numberOfPlayers}`);
      console.log(`About to start timer on room ${this.roomCode}`);
      this.io.to(this.roomCode).emit('message', { message: 'start_timer' });
    }
  }

  // Gameplay
  handleShot(id: string, payload: any) {
    const player = this.playerGameData.find((p: bangbangData) => p.id === id);

    if (player) {
      player.shotTime = payload.time;
      console.log(`Player ${player.id}'s time: ${player.shotTime}`);

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
    }
  }
}

export { BangBang };
