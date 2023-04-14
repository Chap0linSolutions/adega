import { Request, Response } from 'express';
import Store from '../realtime/store';

export default class RoomAccessController {
  async joinRoom(req: Request, res: Response) {
    const activeRooms = Store.getInstance().rooms;
    const roomCode = req.params.code;
    if (activeRooms.has(roomCode)) {
      res.status(200).send('Entrando na sala ' + roomCode + '.');
    } else {
      res.status(404).send();
    }
  }

  async createRoom(req: Request, res: Response) {
    const activeRooms = Store.getInstance().rooms;
    let newRoomCode = '';
    // TODO: implement better DDoS protection method
    if (activeRooms.keys.length <= 500) {
      do {
        newRoomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      } while (activeRooms.has(newRoomCode));
      activeRooms.set(newRoomCode, Store.emptyRoom());
      res.status(200).send(newRoomCode);
    } else {
      res.status(503).send('Limite de salas atingido');
    }
  }

  async checkIfUserWasThere(req: Request, res: Response) {
    const { roomCode, userName, avatarSeed } = req.params;
    console.log(
      `Sala ${roomCode} - verificando se '${userName}' estava na sala previamente... `
    );

    const room = Store.getInstance().rooms.get(roomCode);
    if (room) {
      const userWasThere = room.disconnectedPlayers
        .filter((player) => player.nickname === userName)
        .filter((player) => player.avatarSeed === avatarSeed);

      if (userWasThere.length > 0) {
        return res.status(200).send('O usuário estava na sala e será redirecionado de volta.');
      } else {
        return res.status(403).send('O usuário não estava na sala.');
      }
    }
    return res.status(410).send('A sala não existe mais.');
  }
}
