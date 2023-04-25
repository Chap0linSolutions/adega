import Store from '../../store';
import { Server } from 'socket.io';
import { SimpleCardGame } from './SimpleCardGame';

const mockHandleMoving = jest.fn();

jest.mock('../../index', () => ({
  handleMoving: () => mockHandleMoving(),
}));

const io = new Server();

describe('SimpleCardGame Class', () => {
  beforeAll(() => {
    Store.getInstance();
    const activeRooms = Store.getInstance().rooms;
    const newRoomCode = 'ABCD';
    activeRooms.set(newRoomCode, {
      ...Store.emptyRoom(),
      players: [
        {
          playerID: 1,
          roomCode: 'ABCD',
          currentlyPlaying: false,
          nickname: 'Fred',
          avatarSeed: 'ZXCV',
          beers: 0,
          socketID: '',
          currentTurn: false,
        },
      ],
    });
  });

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    const io = new Server();

    it('should return gameType as "simple"', () => {
      const simpleCardInstance = new SimpleCardGame(
        io,
        'ABCD',
        'Test Game Name'
      );
      expect(simpleCardInstance.gameType).toEqual('simple');
    });

    it('should return gameName as defined when calling "new"', () => {
      const simpleCardInstance = new SimpleCardGame(
        io,
        'ABCD',
        'Test Game Name'
      );
      expect(simpleCardInstance.gameName).toEqual('Test Game Name');
    });

    //TODO: achar um jeito de testar essa chamada
    // it('should call begin()', () => {
    //     const simpleCardInstance = new SimpleCardGame(io, 'ABCD', 'Test Game Name');
    //     const consoleLog = jest.spyOn(console, 'log');
    //     expect(consoleLog).toHaveBeenCalledWith(`Test Game Name!`);
    // });
  });

  describe('handleMessage method', () => {
    it('should not be called during a game', () => {
      const simpleCardInstance = new SimpleCardGame(
        io,
        'testRoom',
        'Test Game Name'
      );
      simpleCardInstance.handleMessage(io, 'not-end-game', '');
      expect(mockHandleMoving).not.toBeCalled();
    });

    it('should redirect to Who Drank after game', () => {
      const simpleCardInstance = new SimpleCardGame(
        io,
        'testRoom',
        'Test Game Name'
      );
      simpleCardInstance.handleMessage(io, 'end-game', '');
      expect(mockHandleMoving).toBeCalled();
    });

    // it('should redirect back to roulette after finishing round', () => {
    //     const nextMove = simpleCardInstance.handleMessage(io, 'end-game', '');
    //     expect(nextMove).toBe(handleMoving(io, 'ABCD', '/WhoDrank'));
    // })
  });
});
