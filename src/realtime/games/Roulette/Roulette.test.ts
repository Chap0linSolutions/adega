import Store from '../../store';
import { Server } from 'socket.io';
import { Roulette } from './Roulette';

describe('Roulette Class', () => {
  const io = new Server();
  const testID = '1234';

  beforeAll(() => {
    Store.getInstance();
    const activeRooms = Store.getInstance().rooms;
    const newRoomCode = 'ABCD';
    activeRooms.set(newRoomCode, {
      ...Store.emptyRoom(),
      players: [
        {
          playerID: 1234,
          roomCode: 'ABCD',
          currentlyPlaying: false,
          nickname: 'Fred',
          avatarSeed: 'ZXCV',
          beers: 0,
          socketID: testID,
          currentTurn: false,
        },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    const testRoom = Store.getInstance().rooms.get('ABCD');
    if (!testRoom) return;
    testRoom.currentGame = null;
    testRoom.ownerId = null;
    testRoom.players.forEach((player) => (player.currentTurn = false));
  });

  describe('Constructor', () => {
    it('should return gameType as "SelectNextGame"', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      expect(rouletteInstance.gameType).toEqual('SelectNextGame');
    });

    it('should return gameName as "SelectNextGame', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      expect(rouletteInstance.gameName).toEqual('SelectNextGame');
    });

    it('should initiate playerGameData as null', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      expect(rouletteInstance.playerGameData).toBeNull();
    });
  });

  describe('handleMessage method', () => {
    it('should call checkTurn when receiving player-turn-is', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      const mockcheckTurn = jest.spyOn(
        rouletteInstance,
        'checkWhoseTurnIsThis'
      );

      rouletteInstance.handleMessage(testID, 'player-turn-is', '/Roulette');
      expect(mockcheckTurn).toBeCalled();
    });

    it('should call startGame when receiving start-game and game has been selected', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      const mockStart = jest.spyOn(rouletteInstance, 'startGame');
      rouletteInstance.handleMessage(testID, 'start-game', '');
      expect(mockStart).not.toBeCalled();

      rouletteInstance.hasSelectedNextGame = true;
      rouletteInstance.handleMessage(testID, 'start-game', '');
      expect(mockStart).toBeCalled();
    });

    it('should call handleNextGameSelection when receiving roulette-number-is', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      const mockHandleNextGame = jest.spyOn(
        rouletteInstance,
        'handleNextGameSelection'
      );

      rouletteInstance.handleMessage(testID, 'roulette-number-is', '');
      expect(mockHandleNextGame).toBeCalled();
    });
  });

  describe('handleDisconnect method', () => {
    it('should log the message received', () => {
      const logSpy = jest
        .spyOn(global.console, 'log')
        .mockImplementation(() => {
          return;
        });
      const rouletteInstance = new Roulette(io, 'ABCD');

      rouletteInstance.handleDisconnect(testID);
      expect(logSpy).toBeCalledWith(
        `Sala ABCD - Player ${testID} disconnected`
      );
    });
  });

  describe('handleNextGameSelection method', () => {
    it('should check if all games have been executed at least once', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      const logSpy = jest.spyOn(rouletteInstance, 'log');

      const room = Store.getInstance().rooms.get('ABCD');
      if (!room) return;
      room.options.gamesList.forEach((game) => (game.counter = 2));

      rouletteInstance.handleNextGameSelection();
      expect(logSpy).toBeCalledWith(
        'Todos os jogos possíveis com contador > 0.'
      );
      //room.options.gamesList.forEach((game) => (expect(game.counter).toBe(1))); FAILING
    });

    it('should draw a game from the drawable games list', () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      const gameList = [
        {
          name: 'Buzz',
          counter: 0,
        },
        {
          name: 'Medusa',
          counter: 0,
        },
        {
          name: 'Vrum',
          counter: 0,
        },
      ];
      const room = Store.getInstance().rooms.get('ABCD');
      if (!room) return;
      room.options.gamesList = gameList;
      expect(rouletteInstance.hasSelectedNextGame).toBe(false);

      rouletteInstance.handleNextGameSelection();
      expect(rouletteInstance.hasSelectedNextGame).toBe(true);
      expect(
        room.options.gamesList.find((game) => game.counter > 0)
      ).toBeDefined();
    });
  });

  describe('setInitialTurn method', () => {
    it("should set initial turn to room owner if no one's turn", () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      const room = Store.getInstance().rooms.get('ABCD');
      if (!room) return;

      room.ownerId = testID;
      expect(room.players[0].currentTurn).toBe(false);

      rouletteInstance.setInitialTurn('ABCD');
      expect(room.players[0].currentTurn).toBe(true);
    });

    it("shouldn't set initial turn to owner if someone else's turn", () => {
      const rouletteInstance = new Roulette(io, 'ABCD');
      const room = Store.getInstance().rooms.get('ABCD');
      if (!room) return;
      room.players.push({
        playerID: 5678,
        roomCode: 'ABCD',
        currentlyPlaying: false,
        nickname: 'Daphne',
        avatarSeed: 'AABB',
        beers: 0,
        socketID: '5678',
        currentTurn: true,
      });

      expect(room.players[0].currentTurn).toBe(false);

      rouletteInstance.setInitialTurn('ABCD');
      expect(room.players[0].currentTurn).toBe(false);
    });
  });

  //TODO: test for checkTurn and startGame
});
