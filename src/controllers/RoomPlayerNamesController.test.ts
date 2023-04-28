import RoomPlayerNameController from "./RoomPlayerNamesController";
import Store from "../realtime/store";
import { getMockReq, getMockRes } from '@jest-mock/express';

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
        currentTurn: false
      },
    ]
  });
});

describe("RoomPlayerNameController", () => {
  describe("checkNameAvailabiliy method", () => {
    it("Should return 200 if user's name is available", () => {
      const controller = new RoomPlayerNameController();
      const req = getMockReq({ params: { roomCode: 'ABCD', userName: 'Maria' } });
      const { res } = getMockRes();

      controller.checkNameAvailabiliy(req, res);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledWith('Nome liberado.');
    });

    it("Should return 409 if user's name isn't available", () => {
      const controller = new RoomPlayerNameController();
      const req = getMockReq({ params: { roomCode: 'ABCD', userName: 'Fred' } });
      const { res } = getMockRes();

      controller.checkNameAvailabiliy(req, res);
      expect(res.status).toBeCalledWith(409);
      expect(res.send).toBeCalledWith('Nome já em uso.');
    });
  });
});