import Store from '../../store';
import { Server } from 'socket.io';
import { EuNunca } from './EuNunca';

describe('EuNunca Class', () => {
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
    it('should return gameType as "dynamic"', () => {
      const euNuncaInstance = new EuNunca(io, 'ABCD');
      expect(euNuncaInstance.gameType).toEqual('dynamic');
    });

    it('should return gameName as "Eu Nunca', () => {
      const euNuncaInstance = new EuNunca(io, 'ABCD');
      expect(euNuncaInstance.gameName).toEqual('Eu Nunca');
    });

    it('should initiate playerGameData as suggestions array', () => {
      const euNuncaInstance = new EuNunca(io, 'ABCD');
      expect(euNuncaInstance.playerGameData).toEqual(
        EuNunca.standardSuggestions
      );
    });
  });

  describe('getSuggestions method', () => {
    it('should return 3 sentences from the suggestions pool', () => {
      const euNuncaInstance = new EuNunca(io, 'ABCD');
      const suggestions = euNuncaInstance.getSuggestions();

      expect(suggestions.length).toEqual(3);
      suggestions.forEach((suggestion) => {
        expect(suggestion).toContain('EU NUNCA');
        const justSuggestion = suggestion.split('EU NUNCA')[1]; // remove EU NUNCA from return
        expect(euNuncaInstance.playerGameData).toContain(justSuggestion);
      });
    });
  });

  describe('getStandardSuggestions method', () => {
    it('should return 3 sentences from the standard suggestions', () => {
      const suggestions = EuNunca.getStandardSuggestions();

      expect(suggestions.length).toEqual(3);
      suggestions.forEach((suggestion) => {
        expect(suggestion).toContain('EU NUNCA');
        const justSuggestion = suggestion.split('EU NUNCA')[1]; // remove EU NUNCA from return
        expect(EuNunca.standardSuggestions).toContain(justSuggestion);
      });
    });
  });

  describe('handleMessage method', () => {
    it('should log the message received', () => {
      const logSpy = jest
        .spyOn(global.console, 'log')
        .mockImplementation(() => {
          return;
        });
      const euNuncaInstance = new EuNunca(io, 'ABCD');

      euNuncaInstance.handleMessage(
        testID,
        'test-message',
        'This is simply a test'
      );
      expect(logSpy).toBeCalledWith(
        `id: ${testID}\tvalue: test-message\tpayload: This is simply a test`
      );
    });

    it('should redirect to Who Drank if game is finished', () => {
      //const handleMovingMock = jest.fn().mockImplementation(handleMoving);
      const euNuncaInstance = new EuNunca(io, 'ABCD');

      euNuncaInstance.handleMessage(testID, 'end-game', 'This is the end...');
      //expect(handleMovingMock).toBeCalled(); FAILING
    });
  });

  describe('handleDisconnect method', () => {
    it('should log the message received', () => {
      const logSpy = jest
        .spyOn(global.console, 'log')
        .mockImplementation(() => {
          return;
        });
      const euNuncaInstance = new EuNunca(io, 'ABCD');

      euNuncaInstance.handleDisconnect(testID);
      expect(logSpy).toBeCalledWith(`Player ${testID} disconnected`);
    });
  });
});
