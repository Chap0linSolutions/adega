import { Request, Response } from 'express';
import Store from '../realtime/store';

export default class RoomPlayerNameController {
  async checkNameAvailabiliy(req: Request, res: Response) {
    const { roomCode, userName } = req.params;
    console.log(
      `Sala ${roomCode} - verificando se '${userName}' está disponível... `
    );

    const currentPlayersInRoom = Store.getInstance().rooms.get(roomCode);
    if (currentPlayersInRoom != undefined) {
      const nameInUse = currentPlayersInRoom.players.find(
        (player) => player.nickname === userName
      );

      if (nameInUse) {
        console.log('Nome já em uso.');
        res.status(400).send();
      } else {
        console.log('Nome liberado.');
        res.status(200).send(true);
      }
    }
  }
}
