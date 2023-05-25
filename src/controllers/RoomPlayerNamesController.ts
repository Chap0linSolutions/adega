import { Request, Response } from 'express';
import Store from '../realtime/store';

export default class RoomPlayerNameController {
  async checkNameAvailabiliy(req: Request, res: Response) {
    const { room, nickname } = req.query;
    if (typeof room !== 'string') return res.status(400).send('Erro de query.');
    const currentPlayersInRoom = Store.getInstance().rooms.get(room);
    if (currentPlayersInRoom != undefined) {
      const nameInUse = currentPlayersInRoom.players.find(
        (player) => player.nickname === nickname
      );

      if (nameInUse) {
        res.status(409).send('Nome já em uso.');
      } else {
        res.status(200).send('Nome liberado.');
      }
    }
  }
}
