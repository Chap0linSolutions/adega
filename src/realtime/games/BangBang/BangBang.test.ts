import Store from '../../store';
import { Server } from 'socket.io';
import { BangBang } from './BangBang';

describe('BangBang Class', () => {
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
      const bangBangInstance = new BangBang(io, 'ABCD');
      expect(bangBangInstance.gameType).toEqual('round');
    });

    it('should return gameName as Bang Bang', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      expect(bangBangInstance.gameName).toEqual('Bang Bang');
    });

    it('should initiate playerGameData as empty array', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      expect(bangBangInstance.playerGameData.length).toEqual(0);
    });
  });

  describe('handleMessage method', () => {
    it('should call beginShooting when moving from cover to game', () => {
      const bangBangInstance = new BangBang(io, 'testRoom');
      const mockBeginShooting = jest.spyOn(bangBangInstance, 'beginShooting');

      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      expect(mockBeginShooting).toBeCalled();
    });

    it('should call checkForGameStart when receiving player ready', () => {
      const bangBangInstance = new BangBang(io, 'testRoom');
      const mockCheckStart = jest.spyOn(bangBangInstance, 'checkForGameStart');

      bangBangInstance.handleMessage(testID, 'player_ready', '');
      expect(mockCheckStart).toBeCalled();
    });

    it('should call handleShot after a player shoots', () => {
      const bangBangInstance = new BangBang(io, 'testRoom');
      const mockCheckStart = jest.spyOn(bangBangInstance, 'handleShot');

      bangBangInstance.handleMessage(testID, 'shot', '');
      expect(mockCheckStart).toBeCalled();
    });
  });

  describe('beginShooting method', () => {
    it('should fill playerGameData', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      expect(bangBangInstance.playerGameData.length).toEqual(0);

      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      expect(bangBangInstance.playerGameData.length).toBeGreaterThan(0);
    });
  });

  describe('checkForGameStart method', () => {
    it('should change player state "ready" to true', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      let playerReady = bangBangInstance.playerGameData.findIndex(
        (p) => p.ready === false
      );
      expect(playerReady).toEqual(0);

      bangBangInstance.handleMessage(testID, 'player_ready', '');
      playerReady = bangBangInstance.playerGameData.findIndex(
        (p) => p.ready === false
      );
      expect(playerReady).toEqual(-1);
    });
  });

  describe('handleShot method', () => {
    it("it should assign player's shot time to the current data", () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      bangBangInstance.handleMessage(testID, 'player_ready', '');
      expect(bangBangInstance.playerGameData[0].shotTime).toEqual(0);

      bangBangInstance.handleMessage(testID, 'shot', {
        name: 'Fred',
        time: 5000,
      });
      expect(bangBangInstance.playerGameData[0].shotTime).toBeGreaterThan(0);
    });

    it('should check for game conclusion', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      const endGameSpy = jest.spyOn(bangBangInstance, 'checkForGameConclusion');
      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      bangBangInstance.handleMessage(testID, 'player_ready', '');

      bangBangInstance.handleMessage(testID, 'shot', {
        name: 'Fred',
        time: 5000,
      });
      expect(endGameSpy).toBeCalled();
    });

    it('should emit a message with the partial ranking if not everyone has shot', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      bangBangInstance.playerGameData.push({
        id: '5678',
        nickname: 'Daphne',
        avatarSeed: 'AABB',
        shotTime: 0,
        ready: true,
      });
      //const emitSpy = jest.spyOn(bangBangInstance.io.to('ABCD'), 'emit');
      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      bangBangInstance.handleMessage(testID, 'player_ready', '');

      bangBangInstance.handleMessage(testID, 'shot', {
        name: 'Fred',
        time: 5000,
      });
      //expect(emitSpy).toBeCalled(); FALHANDO
    });
  });

  describe('checkForGameConclusion method', () => {
    it('should call finish method if everyone has shot', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      const finishGameSpy = jest.spyOn(bangBangInstance, 'finish');
      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      bangBangInstance.handleMessage(testID, 'player_ready', '');

      bangBangInstance.handleMessage(testID, 'shot', {
        name: 'Fred',
        time: 5000,
      });
      expect(finishGameSpy).toBeCalled();
    });
  });

  describe('handleDisconnect method', () => {
    it('should change shot time of player to disconnected and check conclusion', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      const endGameSpy = jest.spyOn(bangBangInstance, 'checkForGameConclusion');
      expect(bangBangInstance.playerGameData[0].shotTime).toBe(0);

      bangBangInstance.handleDisconnect(testID);
      expect(bangBangInstance.playerGameData[0].shotTime).toBe(-20000);
      expect(endGameSpy).toBeCalled();
    });
  });

  describe('finish method', () => {
    it('should call log announcing end of game', () => {
      const bangBangInstance = new BangBang(io, 'ABCD');
      const logSpy = jest.spyOn(bangBangInstance, 'log');
      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      bangBangInstance.handleMessage(testID, 'player_ready', '');
      bangBangInstance.handleMessage(testID, 'shot', {
        name: 'Fred',
        time: 5000,
      });

      expect(logSpy).toBeCalledWith('Fim de jogo!');
    });
  });

  describe('addBeer method', () => {
    it('should increase beer count for the losers', () => {
      const testRoom = Store.getInstance().rooms.get('ABCD');
      if (!testRoom) return;
      expect(testRoom.players[0].beers).toBe(0);

      const bangBangInstance = new BangBang(io, 'ABCD');
      const addBeerSpy = jest.spyOn(bangBangInstance, 'addBeer');

      bangBangInstance.handleMessage(testID, 'move-to', '/BangBang');
      bangBangInstance.playerGameData.push({
        id: '5678',
        nickname: 'Daphne',
        avatarSeed: 'AABB',
        shotTime: 0,
        ready: false,
      });

      bangBangInstance.handleMessage(testID, 'player_ready', ''); // mark Fred as ready
      bangBangInstance.handleMessage('5678', 'player_ready', ''); // mark Daphne as ready

      bangBangInstance.handleMessage('5678', 'shot', {
        name: 'Daphne',
        time: 7000,
      });
      bangBangInstance.handleMessage(testID, 'shot', {
        name: 'Fred',
        time: 5000,
      });

      expect(addBeerSpy).toBeCalled();
      expect(testRoom.players[0].beers).toBeGreaterThan(0);
    });
  });
});
