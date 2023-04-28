import { Request, Response } from 'express';
import Store from '../realtime/store';

const ROOM_EXPIRATION = 10 * 60 * 1000;

export default class RoomAccessController {
  purgeEmptyOldRooms = () => {
    const activeRooms = Store.getInstance().rooms;

    for (const [roomCode, room] of activeRooms) {
      if (
        room.players.length === 0 &&
        Date.now() > room.created_at + ROOM_EXPIRATION
      )
        activeRooms.delete(roomCode);
    }
  };

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
    this.purgeEmptyOldRooms();

    let newRoomCode = '';
    do {
      newRoomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    } while (activeRooms.has(newRoomCode));
    activeRooms.set(newRoomCode, Store.emptyRoom());

    res.status(200).send(newRoomCode);
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
        return res
          .status(200)
          .send('O usuário estava na sala e será redirecionado de volta.');
      } else {
        return res.status(403).send('O usuário não estava na sala.');
      }
    }
    return res.status(410).send('A sala não existe mais.');
  }
}
