import Game from './games/game';

export interface player {
  //todo jogador ao entrar no lobby terá estas infos associadas
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
}

class Store {
  private static instance: Store;
  private data: any = {};
  public rooms: Map<string, RoomContent> = new Map();

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

  static emptyRoom(): RoomContent {
    return {
      players: [],
      currentGame: null,
    };
  }
}

export default Store;
