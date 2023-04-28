import Store from '../../store';
import { Server } from 'socket.io';
import { QuemSouEu } from './QuemSouEu';

describe('QuemSouEu Class', () => {
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
  });

  describe('Constructor', () => {
    it('should return gameType as "round"', () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      expect(quemSouEuInstance.gameType).toEqual('round');
    });

    it('should return gameName as Quem Sou Eu', () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      expect(quemSouEuInstance.gameName).toEqual('Quem Sou Eu');
    });

    it('should initiate playerGameData as empty array', () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      expect(quemSouEuInstance.playerGameData.length).toEqual(0);
    });

    it('should set category to undefined', () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      expect(quemSouEuInstance.category).toBeUndefined();
    });
  });

  describe('handleMessage method', () => {
    it('should call setCategory and updateNames when prompted', () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      const mockUpdateNames = jest.spyOn(quemSouEuInstance, 'updateNames');

      quemSouEuInstance.handleMessage(testID, 'game-category-is', 'Animais');
      expect(quemSouEuInstance.category).toBeDefined();
      expect(mockUpdateNames).toBeCalled();
    });

    it('should log late entries and call updateNames', () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      const logSpy = jest.spyOn(quemSouEuInstance, 'log');
      const message = `O jogador Fred chegou no meio do jogo e pediu para ser atualizado.`;
      const mockUpdateNames = jest.spyOn(quemSouEuInstance, 'updateNames');

      quemSouEuInstance.handleMessage(testID, 'update-me', 'Animais');
      expect(logSpy).toBeCalledWith(message);
      expect(mockUpdateNames).toBeCalled();
    });

    it('should call finish when game ends', () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      const mockFinish = jest.spyOn(quemSouEuInstance, 'finish');
      const mockWinner = JSON.stringify(['Fred']);

      quemSouEuInstance.handleMessage(testID, 'winners-are', mockWinner);
      expect(mockFinish).toBeCalled();
    });
  });

  describe('updateNames method', () => {
    it("should fill players' characters", () => {
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      const logSpy = jest.spyOn(quemSouEuInstance, 'log');
      quemSouEuInstance.names = ['Scooby',];
      quemSouEuInstance.updateNames();

      expect(logSpy).toBeCalledWith('Lista de jogadores e papeis:');
      expect(quemSouEuInstance.playerGameData[0].whoPlayerIs).toBe('Scooby');
    });
  });

  describe('finish method', () => {
    it('should increase the number of beers for the losers', () => {
      const testRoom = Store.getInstance().rooms.get('ABCD');
      if(!testRoom) return;

      expect(testRoom.players[0].beers).toEqual(0);
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      quemSouEuInstance.playerGameData.push({player: 'Fred', whoPlayerIs: 'Shaggy'});
      quemSouEuInstance.playerGameData.push({player: 'Daphne', whoPlayerIs: 'Velma'});

      quemSouEuInstance.finish(['Daphne']);
      expect(testRoom.players[0].beers).toBeGreaterThan(0);
    });
  });

  describe('handleDisconnect method', () => {
    it('should log the player who disconnected', () => {
      const testRoom = Store.getInstance().rooms.get('ABCD');
      if(!testRoom) return;

      testRoom.disconnectedPlayers.push(testRoom.players[0]);
      const quemSouEuInstance = new QuemSouEu(io, 'ABCD');
      const logSpy = jest.spyOn(quemSouEuInstance, 'log');

      quemSouEuInstance.handleDisconnect(testID);
      expect(logSpy).toBeCalledWith(`Fred saiu do jogo.`);
    });
  });
});
