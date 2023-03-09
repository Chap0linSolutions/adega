import { Server } from 'socket.io';
import Store from '../store';

abstract class Game {
  runtimeStorage: Store;
  io: Server;
  roomCode: string;
  abstract gameType: string;
  abstract gameName: string;
  abstract playerGameData: any;

  constructor(io: Server, room: string) {
    this.runtimeStorage = Store.getInstance();
    this.io = io;
    this.roomCode = room;
  }

  abstract handleMessage(id: any, value: any, payload: any): void;
  abstract handleDisconnect(id: string): void;
}

export default Game;
