import { Server } from 'socket.io';
import Game from '../game';
import { player } from '../../store';

type votingSession = {
  nickname: string;
  avatarSeed: string;
  hasVotedIn: player | undefined;
  votesReceived: number;
};

type mostVoted = {
  nickname: string;
  avatarSeed: string;
  votes: number;
};

class OEscolhido extends Game {
  playerGameData: player[];
  session: votingSession[];
  mostVotedPlayers: mostVoted[];

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = this.runtimeStorage.rooms.get(room)
      ?.players as player[];
    this.session = [];
    this.mostVotedPlayers = [];
    this.roomCode = room;

    this.beginVoting();
  }

  //id: socketID
  //value: a tag da mensagem
  //payload: o corpo da mensagem em si
  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'voted-player') {
      this.handleVote(id, payload.player);
      return;
    }
    if (value === 'vote-results') {
      if (this.playerGameData) {
        console.log(
          `Sala ${this.roomCode} - O tempo da partida acabou. Contabilizando votos existentes...`
        );
        this.finishVoting();
      }
    }
  }

  handleVote(socketID: string, votedPlayer: string) {
    //contabilização dos votos
    //console.log(votedPlayer);
    const vote = JSON.parse(votedPlayer);
    const whoVoted = this.playerGameData.find(
      (player) => player.socketID === socketID
    );

    this.session?.forEach((player) => {
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
          `Sala ${this.roomCode} - ${whoVoted?.nickname} votou em ${player.nickname}, que tem agora ${player.votesReceived} votos no total.`
        );
      }
    });

    let allVoted = true;

    if (this.session.find((player) => player.hasVotedIn === undefined)) {
      allVoted = false; //se ainda faltar alguém pra votar, paramos nesse return
    }

    if (allVoted) {
      this.finishVoting(); //se todos já votaram, por outro lado, prosseguimos com os resultados
    }
  }

  beginVoting() {
    console.log(
      `Sala ${this.roomCode} - o jogo 'O Escolhido' foi iniciado. Todos os players desta sala tiveram seus dados de votação zerados.`
    );
    this.session = [];

    const players: votingSession[] = [];
    this.playerGameData.forEach((player) => {
      players.push({
        nickname: player.nickname,
        avatarSeed: player.avatarSeed,
        hasVotedIn: undefined,
        votesReceived: 0,
      });
    });

    console.log(`${players.length} jogadores se encontram neste jogo.\n`);
    this.session = players;
  }

  finishVoting() {
    let highestVoteCount = 0;
    const mostVotedPlayers: mostVoted[] = [];

    this.session.forEach((player) => {
      //encontra maior número de votos
      if (player.votesReceived > highestVoteCount) {
        highestVoteCount = player.votesReceived;
      }
    });

    this.session.forEach((player) => {
      //inclui os mais votados no respectivo vetor
      if (player.votesReceived === highestVoteCount) {
        mostVotedPlayers.push({
          nickname: player.nickname,
          avatarSeed: player.avatarSeed,
          votes: player.votesReceived,
        });
      }
    });

    mostVotedPlayers.forEach((mostVotedPlayer) => {
      this.playerGameData?.forEach((player) => {
        if (
          player.nickname === mostVotedPlayer.nickname &&
          player.avatarSeed === mostVotedPlayer.avatarSeed
        ) {
          player.beers += 1;
        }
      });
    });

    console.log(
      `Sala ${this.roomCode} - Todos os votos da sala foram contabilizados. Enviando resultado para os jogadores.`
    );
    this.io
      .to(this.roomCode)
      .emit('vote-results', JSON.stringify(mostVotedPlayers));
    this.mostVotedPlayers = [];
    this.updateTurn(this.roomCode);
  }

  handleDisconnect(id: string): void {
    console.log(`User ${id} has disconnected`);
  }
}

export { OEscolhido };
