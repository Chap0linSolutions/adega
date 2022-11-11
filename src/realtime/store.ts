export interface player {
  //todo jogador ao entrar no lobby terá estas infos associadas
  id: number;
  roomCode: string;
  nickname: string;
  avatarSeed: string;
  beers: number;
  socketID: string;
}
export interface votingSession {
  //para o jogo da votação precisamos saber quem votou e quantos votos cada um recebeu
  nickname: string;
  avatarSeed: string;
  hasVotedIn: player | undefined;
  votesReceived: number;
}

export interface mostVoted {
  nickname: string;
  avatarSeed: string;
  votes: number;
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

  //jogo da votação
  voting = new Map<string, votingSession[]>();
}

export default Store;
