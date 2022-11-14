import { Server } from 'socket.io';
import Store from '../store';

abstract class Game {
  runtimeStorage: Store;
  io: Server;
  runningOnRoom: string;
  numberOfPlayers: number;
  abstract playerGameData: any;

  constructor(io: Server, room: string) {
    this.runtimeStorage = Store.getInstance();
    this.io = io;
    this.runningOnRoom = room;
    this.numberOfPlayers = 0;
  }

  abstract handleMessage(id: any, value: any, payload: any): void;
}

export default Game;
