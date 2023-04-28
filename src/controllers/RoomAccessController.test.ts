import RoomAccessController from './RoomAccessController';
import Store from '../realtime/store';
import { getMockReq, getMockRes } from '@jest-mock/express';

const roomABCD = {
  ...Store.emptyRoom(),
  disconnectedPlayers: [
    {
      playerID: 1,
      roomCode: 'ABCD',
      currentlyPlaying: false,
      nickname: 'Fred',
      avatarSeed: 'QWER',
      beers: 0,
      socketID: '',
      currentTurn: false,
    },
  ],
};

// old inactive room to be purged
const roomOLDR = {
  ...Store.emptyRoom(),
  created_at: Date.now() - 15 * 60 * 1000,
};

describe('RoomAccessController', () => {
  beforeEach(() => {
    Store.getInstance();
    const activeRooms = Store.getInstance().rooms;
    activeRooms.set('ABCD', roomABCD);
    activeRooms.set('OLDR', roomOLDR);
  });

  describe('purgeEmptyOldRooms method', () => {
    it('should purge old rooms', () => {
      const rooms = Store.getInstance().rooms;
      rooms.set('ABCD', roomABCD);
      rooms.set('OLDR', roomOLDR);
      expect(rooms.get('OLDR')).not.toBeUndefined();

      const controller = new RoomAccessController();
      controller.purgeEmptyOldRooms();
      expect(rooms.get('OLDR')).toBeUndefined();
    });
  });
  describe('JoinRoom method', () => {
    it('should return 200 when room exist', () => {
      const controller = new RoomAccessController();
      const req = getMockReq({ params: { code: 'ABCD' } });
      const { res } = getMockRes();

      controller.joinRoom(req, res);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledWith('Entrando na sala ABCD.');
    });

    it("should return 404 when room doesn't exist", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({ params: { code: 'EFGH' } });
      const { res } = getMockRes();

      controller.joinRoom(req, res);
      expect(res.status).toBeCalledWith(404);
      expect(res.send).toBeCalled();
    });
  });

  describe('createRoom method', () => {
    it('should call purgeEmptyOldRooms', () => {
      const controller = new RoomAccessController();
      controller.purgeEmptyOldRooms = jest.fn();
      const req = getMockReq();
      const { res } = getMockRes();

      controller.createRoom(req, res);
      expect(controller.purgeEmptyOldRooms).toBeCalled();
    });

    it('should return 200 if room creation works well', () => {
      const controller = new RoomAccessController();
      const req = getMockReq();
      const { res } = getMockRes();

      controller.createRoom(req, res);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalled();
    });
  });

  describe('CheckIfUserWasThere method', () => {
    it('should return 200 if user was in the room', () => {
      const controller = new RoomAccessController();
      const req = getMockReq({
        params: { roomCode: 'ABCD', userName: 'Fred', avatarSeed: 'QWER' },
      });
      const { res } = getMockRes();

      controller.checkIfUserWasThere(req, res);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledWith(
        'O usuário estava na sala e será redirecionado de volta.'
      );
    });

    it("should return 403 if user wasn't in the room", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({
        params: { roomCode: 'ABCD', userName: 'Caio', avatarSeed: 'ASDF' },
      });
      const { res } = getMockRes();

      controller.checkIfUserWasThere(req, res);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledWith('O usuário não estava na sala.');
    });

    it("should return 410 if the room doesn't exist anymore", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({
        params: { roomCode: 'EFGH', userName: 'Fred', avatarSeed: 'QWER' },
      });
      const { res } = getMockRes();

      controller.checkIfUserWasThere(req, res);
      expect(res.status).toBeCalledWith(410);
      expect(res.send).toBeCalledWith('A sala não existe mais.');
    });
  });
});
