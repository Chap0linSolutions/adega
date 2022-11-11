import { Socket, Server } from 'socket.io';
import Store, { player, votingSession, mostVoted } from './store';

class SocketConnection {
  socket: Socket;
  io: Server;
  runtimeStorage: Store;
  rooms: Map<string, player[]>;
  voting: Map<string, votingSession[]>;

  constructor(io: Server, socket: Socket) {
    this.io = io;
    this.socket = socket;

    this.runtimeStorage = Store.getInstance();
    this.rooms = this.runtimeStorage.rooms;
    this.voting = this.runtimeStorage.voting;

    console.log(`Conexão socket estabelecida - ID do cliente ${socket.id}\n`);
    this.socket.emit('connection', 'OK');

    this.socket.on('join-room', (roomCode, callback) => {
      const reply = this.joinRoom(roomCode);
      callback(reply);
    });

    this.socket.on('create-room', (roomCode) => {
      this.createRoom(roomCode);
    });

    this.socket.on('room-exists', (roomCode) => {
      this.verifyIfRoomExists(roomCode);
    });

    this.socket.on('add-player', (newPlayerData) => {
      this.addPlayer(newPlayerData);
    });

    this.socket.on('lobby-update', (roomCode) => {
      const players = JSON.stringify(this.rooms.get(roomCode));
      this.io.to(roomCode).emit('lobby-update', players);
    });

    this.socket.on('disconnect', () => {
      this.disconnect();
    });

    this.socket.on('message', (value) => {
      this.handleMessage(value.message, value.room, value.payload);
    });

    this.socket.on('move-room-to', (value) => {
      this.handleMoving(value.roomCode, value.destination);
    });

    this.socket.on('voted-player', (value) => {
      //jogo da votação - mudar para classe separada posteriormente
      this.handleVote(value.roomCode, value.player);
    });

    this.socket.on('vote-results', (roomCode) => {
      const votingSession = this.voting.get(roomCode);
      if (votingSession) {
        console.log(
          `Sala ${roomCode} - O tempo da partida acabou. Contabilizando votos existentes...`
        );
        this.finishVoting(roomCode, votingSession);
      }
    });
  }

  joinRoom(roomCode: string) {
    console.log(`${this.socket.id} tentou se conectar à sala ${roomCode}\n`);
    let reply = 'a sala não existe.';
    const players = this.rooms.get(roomCode);
    if (players) {
      this.socket.join(roomCode);
      reply = `ingressou na sala ${roomCode}.`;
    }
    return reply;
  }

  createRoom(roomCode: string) {
    this.rooms.set(roomCode, []);
    this.socket.emit('create-room', `sala ${roomCode} criada com sucesso.`);
  }

  verifyIfRoomExists(roomCode: string) {
    let reply = 'a sala não existe.';
    if (this.rooms.has(roomCode)) {
      reply = `a sala ${roomCode} existe.`;
    }
    this.socket.emit('room-exists', reply);
  }

  addPlayer(newPlayerData: string) {
    let index = -1;
    let beerCount = 0;
    let npd = { ...JSON.parse(newPlayerData), socketID: this.socket.id };

    const players = this.rooms.get(npd.roomCode);
    let playerID = Math.floor(10000 * Math.random());

    //console.log(`players da sala antes: ${JSON.stringify(players)}\n`);

    if (players) {
      players.forEach((p: player) => {
        //se já existir um player no jogo com o mesmo id de socket, não vamos adicionar novamente e sim atualizar o existente
        if (p.socketID === this.socket.id) {
          beerCount = p.beers;
          index = players.indexOf(p);
        }
      });

      if (index >= 0) {
        players.splice(index, 1);
        console.log(`atualizados os dados do jogador ${JSON.stringify(npd)}\n`);
      } else {
        console.log(
          `adicionado os dados do jogador de ID ${
            this.socket.id
          } --> ${JSON.stringify(npd)}\n`
        );
      }

      players.push({ ...npd, beers: beerCount, id: playerID });
      this.rooms.delete(npd.roomCode);
      this.rooms.set(npd.roomCode, players);

      //console.log(`players atualmente na sala:  ${JSON.stringify(players)}\n`);
      this.io.to(npd.roomCode).emit('lobby-update', JSON.stringify(players));
    }
  }

  sendMessage(message: string, room: string) {
    console.log('hey\n', room, message);
    this.io.to(room).emit('message', { message, room });
  }

  disconnect() {
    let index = 0;
    let targetRoom = '';

    for (const room of this.rooms) {
      const players = room[1];
      players.forEach((p: player) => {
        if (p.socketID === this.socket.id) {
          index = players.indexOf(p);
          targetRoom = p.roomCode;
          console.log(`o jogador ${JSON.stringify(p)} saiu.\n`);
        }
      });
    }
    this.rooms.get(targetRoom)?.splice(index, 1);
    this.io
      .to(targetRoom)
      .emit('lobby-update', JSON.stringify(this.rooms.get(targetRoom)));
  }

  handleMessage(value: any, room: string, payload: any) {
    console.log(`tag: ${value}\n`);
    if (value === 'player_ready') {
      if (
        this.runtimeStorage.players.find(
          (p: any) => p.id === this.socket.id
        ) === undefined
      ) {
        this.runtimeStorage.players.push({
          id: this.socket.id,
        });
      }

      if (this.runtimeStorage.players.length === 2) {
        this.sendMessage('start_timer', '1');
      }
    }

    if (value === 'shot') {
      const player = this.runtimeStorage.players.find(
        (p: any) => p.id === this.socket.id
      );
      player.time = payload.time;
      console.log(player.time);

      const hasFired = this.runtimeStorage.players
        .map((p: any) => !!p.time)
        .reduce((ac: any, at: any) => ac && at);
      console.log(hasFired);
      if (hasFired) {
        const winnerID = this.runtimeStorage.players.sort(
          (a: any, b: any) => b.time - a.time
        )[0].id;
        this.io
          .to('1')
          .emit('message', { message: 'bangbang_result', id: winnerID });
        this.runtimeStorage.players = [];
      }
    }
  }

  //VOTAÇÃO/////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleMoving(roomCode: string, destination: string) {
    if (destination === '/OEscolhido') {
      this.beginVoting(roomCode);
    }
    this.io.to(roomCode).emit('room-is-moving-to', destination);
  }

  beginVoting(roomCode: string) {
    console.log(
      `Sala ${roomCode} - o jogo 'O Escolhido' foi iniciado. Todos os players desta sala tiveram seus dados de votação zerados.`
    );
    this.voting.delete(roomCode);

    const players: votingSession[] = [];
    this.rooms.get(roomCode)?.forEach((player) => {
      players.push({
        nickname: player.nickname,
        avatarSeed: player.avatarSeed,
        hasVotedIn: undefined,
        votesReceived: 0,
      });
    });

    console.log(`${players.length} jogadores se encontram neste jogo.\n`);
    this.voting.set(roomCode, players);
  }

  handleVote(roomCode: string, votedPlayer: string) {
    //contabilização dos votos
    const vote = JSON.parse(votedPlayer);
    const whoVoted = this.rooms
      .get(roomCode)
      ?.find((player) => player.socketID === this.socket.id);
    const session = this.voting.get(roomCode);

    session?.forEach((player) => {
      if (
        player.nickname === whoVoted?.nickname &&
        player.avatarSeed === whoVoted?.avatarSeed
      ) {
        player.hasVotedIn = vote;
      }
      if (
        player.nickname === vote.nickname &&
        player.avatarSeed === vote.avatarSeed
      ) {
        player.votesReceived += 1;
        console.log(
          `Sala ${roomCode} - ${whoVoted?.nickname} votou em ${player.nickname}, que tem agora ${player.votesReceived} votos no total.`
        );
      }
    });

    let allVoted = true;
    session?.forEach((player) => {
      if (player.hasVotedIn === undefined) {
        console.log(`Sala ${roomCode} - Ainda há jogadores que não votaram.`);
        allVoted = false; //se ainda faltar alguém pra votar, paramos nesse return
      }
    });

    if (allVoted) {
      this.finishVoting(roomCode, session as votingSession[]); //se todos já votaram, por outro lado, prosseguimos com os resultados
      this.voting.delete(roomCode);
    }
  }

  finishVoting(roomCode: string, session: votingSession[]) {
    let highestVoteCount = 0;
    const mostVotedPlayers: mostVoted[] = [];

    session.forEach((player) => {
      //encontra maior número de votos
      if (player.votesReceived > highestVoteCount) {
        highestVoteCount = player.votesReceived;
      }
    });

    session.forEach((player) => {
      //inclui os mais votados no respectivo vetor
      if (player.votesReceived === highestVoteCount) {
        mostVotedPlayers.push({
          nickname: player.nickname,
          avatarSeed: player.avatarSeed,
          votes: player.votesReceived,
        });
      }
    });

    const playerList = this.rooms.get(roomCode);
    mostVotedPlayers.forEach((mostVotedPlayer) => {
      playerList?.forEach((player) => {
        if (
          player.nickname === mostVotedPlayer.nickname &&
          player.avatarSeed === mostVotedPlayer.avatarSeed
        ) {
          player.beers += 1;
        }
      });
    });

    console.log(
      `Sala ${roomCode} - Todos os votos da sala foram contabilizados. Enviando resultado para os jogadores.`
    );
    this.io.to(roomCode).emit('vote-results', JSON.stringify(mostVotedPlayers)); //não é absolutamente necessário usar o stringify, mas pode ser boa prática
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    new SocketConnection(io, socket);
  });
}

export default realtime;

// setTimeout(() => {
//   const mostVotedPlayer = [{...player, votes: 20}]
//   console.log('enviados os resultados da votação.');
//   this.io.to(roomCode).emit('vote-results', JSON.stringify(mostVotedPlayer));   //a resposta aos clientes é o apelido, avatar e quantidade de votos do jogador mais votado
// }, 5000);
