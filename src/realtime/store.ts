import { OptionsType, defaultGameList } from './games/GameOptions';
import { Server } from 'socket.io';
import { EuNunca } from './games/EuNunca/EuNunca';
import { SimpleCardGame } from './games/SimpleCardGame/SimpleCardGame';
import BangBang from './games/BangBang';
import OEscolhido from './games/OEscolhido';
import QuemSouEu from './games/QuemSouEu';
import Game from './games/game';
import Roulette from './games/Roulette';
import { JogoDoDesafio } from './games/JogoDoDesafio/JogoDoDesafio';

export interface player {
  //todo jogador ao entrar no lobby terá estas infos associadas
  playerID: number;
  roomCode: string;
  currentlyPlaying: boolean;
  nickname: string;
  avatarSeed: string;
  beers: number;
  socketID: string;
  currentTurn: boolean;
}

export interface RoomContent {
  players: player[];
  disconnectedPlayers: player[];
  currentGame: Game | null;
  currentPage: number | null;
  lastGameName: string | null;
  options: OptionsType;
  ownerId: string | null;
}

class Store {
  private static instance: Store;
  private data: any = {};
  public rooms: Map<string, RoomContent> = new Map([]);

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
      case 'Roulette':
        newGame = new Roulette(io, roomCode);
        break;
      case 'O Escolhido':
        newGame = new OEscolhido(io, roomCode);
        break;
      case 'Bang Bang':
        newGame = new BangBang(io, roomCode);
        break;
      case 'Quem Sou Eu':
        newGame = new QuemSouEu(io, roomCode);
        break;
      case 'Eu Nunca':
        newGame = new EuNunca(io, roomCode);
        break;
      case 'Jogo do Desafio':
        newGame = new JogoDoDesafio(io, roomCode);
        break;
      default:
        newGame = new SimpleCardGame(io, roomCode, gameName);
        break;
    }
    const currentRoom = this.rooms.get(roomCode);
    if (currentRoom) {
      currentRoom.currentGame = newGame;
      currentRoom.currentPage = null;
      return;
    }
    console.log(
      `Erro! O jogo na sala ${roomCode} não pôde ser iniciado - this.rooms.get(roomCode) resultou em 'undefined'.`
    );
  }

  static emptyRoom(): RoomContent {
    return {
      players: [],
      disconnectedPlayers: [],
      currentGame: null,
      currentPage: null,
      lastGameName: null,
      options: {
        gamesList: defaultGameList,
      },
      ownerId: null,
    };
  }
}

export default Store;
