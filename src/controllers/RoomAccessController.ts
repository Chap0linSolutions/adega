import { Request, Response } from 'express';
import Store, { player } from '../realtime/store';

export default class RoomAccessController {
  async joinRoom(req: Request, res: Response) {
    const activeRooms = Store.getInstance();
    const roomCode = req.params.code;
    if (activeRooms.rooms.has(roomCode)) {
      res.status(200).send('Entrando na sala ' + roomCode + '.');
    } else {
      res.status(404).send();
    }
  }
}
