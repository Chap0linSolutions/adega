import Store from '../../store';
import { Server } from 'socket.io';
import { OEscolhido } from './OEscolhido';

describe('OEscolhido Class', () => {
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
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      expect(oEscolhidoInstance.gameType).toEqual('round');
    });

    it('should return gameName as O Escolhido', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      expect(oEscolhidoInstance.gameName).toEqual('O Escolhido');
    });

    it('should initiate playerGameData as empty array', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      expect(oEscolhidoInstance.playerGameData.length).toEqual(0);
    });
  });

  describe('handleMessage method', () => {
    it('should call beginVoting when moving from cover to game', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      const mockBeginVoting = jest.spyOn(oEscolhidoInstance, 'beginVoting');

      oEscolhidoInstance.handleMessage(testID, 'move-to', '/OEscolhido');
      expect(mockBeginVoting).toBeCalled();
    });

    it('should call handleVote after a player votes', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      const mockHandleVote = jest.spyOn(oEscolhidoInstance, 'handleVote');

      oEscolhidoInstance.handleMessage(testID, 'voted-player', {
        player: JSON.stringify({ isObject: true }),
      });
      expect(mockHandleVote).toBeCalled();
    });

    it('should call finishVoting when game ends', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      const mockFinishVoting = jest.spyOn(oEscolhidoInstance, 'finishVoting');

      oEscolhidoInstance.handleMessage(testID, 'vote-results', '');
      expect(mockFinishVoting).toBeCalled();
    });
  });

  describe('beginVoting method', () => {
    it('should fill playerGameData and log number of players', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      const logSpy = jest.spyOn(oEscolhidoInstance, 'log');
      expect(oEscolhidoInstance.playerGameData.length).toEqual(0);

      oEscolhidoInstance.handleMessage(testID, 'move-to', '/OEscolhido');
      expect(oEscolhidoInstance.playerGameData.length).toBeGreaterThan(0);
      expect(logSpy).toBeCalledWith(`1 jogadores se encontram neste jogo.`);
    });
  });

  describe('handleVote method', () => {
    it("it should register player's vote", () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      oEscolhidoInstance.handleMessage(testID, 'move-to', '/OEscolhido');
      const daphne = {
        nickname: 'Daphne',
        avatarSeed: 'AABB',
        hasVotedIn: undefined,
        votesReceived: 0,
        canVote: true,
      };
      oEscolhidoInstance.playerGameData.push(daphne);

      expect(oEscolhidoInstance.playerGameData[0].hasVotedIn).not.toBeDefined();
      expect(oEscolhidoInstance.playerGameData[1].votesReceived).toBe(0);

      oEscolhidoInstance.handleVote(testID, JSON.stringify(daphne));
      expect(oEscolhidoInstance.playerGameData[0].hasVotedIn).toBeDefined();
      expect(
        oEscolhidoInstance.playerGameData[1].votesReceived
      ).toBeGreaterThan(0);
    });

    it('should check for voting status', () => {
      const fred = Store.getInstance().rooms.get('ABCD')?.players[0];

      if (!fred) return;

      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      const checkVoteSpy = jest.spyOn(oEscolhidoInstance, 'checkVotingStatus');
      oEscolhidoInstance.handleMessage(testID, 'move-to', '/OEscolhido');

      oEscolhidoInstance.handleVote(testID, JSON.stringify(fred));
      expect(checkVoteSpy).toBeCalled();
    });
  });

  describe('checkVotingStatus method', () => {
    it('should call finish method if everyone has shot', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      const fred = Store.getInstance().rooms.get('ABCD')?.players[0];
      const finishVoteSpy = jest.spyOn(oEscolhidoInstance, 'finishVoting');

      oEscolhidoInstance.handleMessage(testID, 'move-to', '/OEscolhido');
      oEscolhidoInstance.checkVotingStatus();
      expect(finishVoteSpy).not.toBeCalled();

      oEscolhidoInstance.playerGameData[0].hasVotedIn = fred;
      oEscolhidoInstance.checkVotingStatus();
      expect(finishVoteSpy).toBeCalled();
    });
  });

  describe('handleDisconnect method', () => {
    it('should change hasVotedIn of player to "no player" and check status', () => {
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      oEscolhidoInstance.handleMessage(testID, 'move-to', '/OEscolhido');
      expect(oEscolhidoInstance.playerGameData[0].hasVotedIn).not.toBeDefined();

      const fred = Store.getInstance().rooms.get('ABCD')?.players.pop();
      if (!fred) return;

      Store.getInstance().rooms.get('ABCD')?.disconnectedPlayers.push(fred);
      oEscolhidoInstance.handleDisconnect(testID);

      expect(oEscolhidoInstance.playerGameData[0].hasVotedIn).toBe(
        oEscolhidoInstance.noPlayer
      );
    });
  });

  describe('finish method', () => {
    it('should call log announcing end of game', () => {
      const endLog = `Sala ABCD - Todos os votos da sala foram contabilizados. Enviando resultado para os jogadores.`;
      const oEscolhidoInstance = new OEscolhido(io, 'ABCD');
      const fred = Store.getInstance().rooms.get('ABCD')?.players[0];

      if (!fred) return;

      const logSpy = jest.spyOn(oEscolhidoInstance, 'log');
      oEscolhidoInstance.handleMessage(testID, 'move-to', '/OEscolhido');
      oEscolhidoInstance.playerGameData[0].hasVotedIn = fred;
      oEscolhidoInstance.playerGameData[0].votesReceived = 1;

      oEscolhidoInstance.finishVoting();
      expect(logSpy).toBeCalledWith(endLog);
    });
  });
});
