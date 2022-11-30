import { Server } from 'socket.io';
import BangBang from './games/BangBang';
import OEscolhido from './games/OEscolhido';
import Game from './games/game';
import { OptionsType, defaultGameList } from './games/GameOptions';

export interface player {
  //todo jogador ao entrar no lobby terá estas infos associadas
  playerID: number;
  roomCode: string;
  currentlyPlaying: boolean;
  nickname: string;
  avatarSeed: string;
  beers: number;
  socketID: string;
}
export interface RoomContent {
  players: player[];
  currentGame: Game | null;
  lastGameName: string | null;
  options: OptionsType;
}

class Store {
  private static instance: Store;
  private data: any = {};
  public rooms: Map<string, RoomContent> = new Map([
    ['123456', Store.emptyRoom()],
  ]);

  static getInstance() {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }
  getData(key: string) {
    return this.data[key];
  }
  setData(key: string, value: any, force = false) {
    if (force || !this.data[key]) {
      this.data[key] = value;
      return;
    }
    throw 'property already set';
  }

  startGameOnRoom(roomCode: string, gameName: string, io: Server) {
    let newGame = null;

    switch (gameName) {
      case 'O Escolhido':
        //newGame = new OEscolhido(io, roomCode);
        break;
      case 'Bang Bang':
        newGame = new BangBang(io, roomCode);
        break;
      default:
        console.log('Erro! O jogo solicitado ainda não foi implementado.');
        return;
    }
    let currentRoom = this.rooms.get(roomCode);
    if (currentRoom) {
      currentRoom.currentGame = newGame;
      return;
    }
    console.log(
      `Erro! O jogo na sala ${roomCode} não pôde ser iniciado - this.rooms.get(roomCode) resultou em 'undefined'.`
    );
  }

  static emptyRoom(): RoomContent {
    return {
      players: [],
      currentGame: null,
      lastGameName: null,
      options: {
        gamesList: defaultGameList,
      },
    };
  }
}

export default Store;
