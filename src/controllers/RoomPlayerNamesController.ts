import { Request, Response } from 'express';
import Store from '../realtime/store';

export default class RoomPlayerNameController {
  async checkNameAvailabiliy(req: Request, res: Response) {
    const room = req.params.roomCode;
    const nameToVerify = req.params.userName;
    console.log(
      `Sala ${room} - verificando se '${nameToVerify}' está disponível... `
    );

    const currentPlayersInRoom = Store.getInstance().rooms.get(room);
    if (currentPlayersInRoom != undefined) {
      const nameInUse = currentPlayersInRoom.players.find(
        (player) => player.nickname === nameToVerify
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
