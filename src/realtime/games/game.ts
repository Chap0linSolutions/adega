import { Server } from 'socket.io';
import Store from '../store';

abstract class Game {
  runtimeStorage: Store;
  io: Server;
  roomCode: string;
  numberOfPlayers: number;
  abstract playerGameData: any;

  constructor(io: Server, room: string) {
    this.runtimeStorage = Store.getInstance();
    this.io = io;
    this.roomCode = room;
    this.numberOfPlayers = 0;
  }

  abstract handleMessage(id: any, value: any, payload: any): void;
  abstract handleDisconnect(id: string): void;
}

export default Game;
