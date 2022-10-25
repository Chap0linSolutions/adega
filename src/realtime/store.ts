export interface player {
  //todo jogador ao entrar no lobby terá estas infos associadas
  roomCode: string;
  nickname: string;
  avatarSeed: string;
  beers: number;
  socketID: string;
}

class Store {
  private static instance: Store;
  private data: any = {};
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

  players: any = [];

  rooms = new Map<string, player[]>([
    ['1', []], //sala do BangBang
    ['ABCDEF', []],
    ['XYZ123', []],
    ['123456', []],
  ]);
}

export default Store;
