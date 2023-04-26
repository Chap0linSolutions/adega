import RoomAccessController from "./RoomAccessController";
import Store from "../realtime/store";
import { getMockReq, getMockRes } from '@jest-mock/express';

beforeAll(() => {
  Store.getInstance();
  const activeRooms = Store.getInstance().rooms;
  const newRoomCode = 'ABCD';
  activeRooms.set(newRoomCode, {
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
        currentTurn: false
      }
    ]
  });
});

describe("RoomAccessController", () => {
  describe("JoinRoom method", () => {
    it("Should return 200 when room exist", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({ params: { code: 'ABCD' } });
      const { res } = getMockRes();

      controller.joinRoom(req, res);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledWith('Entrando na sala ABCD.')
    });

    it("Should return 404 when room doesn't exist", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({ params: { code: 'EFGH' } });
      const { res } = getMockRes();

      controller.joinRoom(req, res);
      expect(res.status).toBeCalledWith(404);
      expect(res.send).toBeCalled();
    });
  });
 
  describe("createRoom method", () => {
    it("Should return 200 if room creation works well", () => {
      const controller = new RoomAccessController();
      const req = getMockReq();
      const { res } = getMockRes();

      controller.createRoom(req, res);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalled();
    });
  });

  describe("CheckIfUserWasThere method", () => {
    it("Should return 200 if user was in the room", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({ params: { roomCode: 'ABCD', userName: 'Fred', avatarSeed: 'QWER' } });
      const { res } = getMockRes();

      controller.checkIfUserWasThere(req, res);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledWith('O usuário estava na sala e será redirecionado de volta.');
    });

    it("Should return 403 if user wasn't in the room", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({ params: { roomCode: 'ABCD', userName: 'Caio', avatarSeed: 'ASDF' } });
      const { res } = getMockRes();

      controller.checkIfUserWasThere(req, res);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledWith('O usuário não estava na sala.');
    });

    it("Should return 410 if the room doesn't exist anymore", () => {
      const controller = new RoomAccessController();
      const req = getMockReq({ params: { roomCode: 'EFGH', userName: 'Fred', avatarSeed: 'QWER' } });
      const { res } = getMockRes();

      controller.checkIfUserWasThere(req, res);
      expect(res.status).toBeCalledWith(410);
      expect(res.send).toBeCalledWith('A sala não existe mais.');
    });
  });

});
