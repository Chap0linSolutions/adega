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

  updateTurn(roomCode: string) {
    const currentRoom = this.runtimeStorage.rooms.get(roomCode);
    let currentTurnIndex = currentRoom?.players.findIndex(
      (player) => player.currentTurn == true
    );
    currentRoom!.players[currentTurnIndex!].currentTurn = false;
    if (currentTurnIndex! < currentRoom!.players.length - 1) {
      currentTurnIndex! += 1;
    } else {
      currentTurnIndex! = 0;
    }
    currentRoom!.players[currentTurnIndex!].currentTurn = true;
    console.log('\nNext player to play:');
    console.log(currentRoom?.players[currentTurnIndex!].nickname);
  }
}

export default Game;
