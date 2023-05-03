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

  async checkRoom(req: Request, res: Response) {
    const activeRooms = Store.getInstance().rooms;
    const roomCode = req.query.room;
    console.log('Verificação de existência da sala de código', roomCode);
    if (typeof roomCode === 'string' && activeRooms.has(roomCode)) {
      res.status(200).send('Entrando na sala ' + roomCode + '.');
    } else {
      res.status(404).send();
    }
  }

  async createRoom(req: Request, res: Response) {
    const activeRooms = Store.getInstance().rooms;
    const roomCode = req.query.room;
    console.log('Tentativa de criar sala de código', roomCode);
    if (typeof roomCode === 'string' && !activeRooms.has(roomCode)) {
      activeRooms.set(roomCode, Store.emptyRoom());
      res.status(200).send(roomCode);
    } else {
      res.status(400).send();
    }
  }

  async checkIfUserWasThere(req: Request, res: Response) {
    const { room, nickname, avatar } = req.query;
    console.log(
      `Sala ${room} - verificando se '${nickname}' estava na sala previamente... `
    );
    if (typeof room !== 'string') return res.status(400).send('Erro de query.');
    const roomCode = Store.getInstance().rooms.get(room);
    if (roomCode) {
      const userWasThere = roomCode.disconnectedPlayers
        .filter((player) => player.nickname === nickname)
        .filter((player) => player.avatarSeed === avatar);

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

// this.purgeEmptyOldRooms();

// let newRoomCode = '';
// do {
//   newRoomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
// } while (activeRooms.has(newRoomCode));
// activeRooms.set(newRoomCode, Store.emptyRoom());
