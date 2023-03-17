import { Server } from 'socket.io';
import Game from '../game';
import { player } from '../../store';
import { handleMoving } from '../../index';

type votingSession = {
  nickname: string;
  avatarSeed: string;
  hasVotedIn: player | undefined;
  votesReceived: number;
  canVote: boolean;
};

class OEscolhido extends Game {
  gameName = 'O Escolhido';
  gameType = 'round';
  playerGameData: votingSession[];
  noPlayer: player = {
    //quem cair durante o jogo vai votar no noPlayer
    playerID: -1,
    roomCode: 'none',
    currentlyPlaying: true,
    nickname: 'a girl has no name',
    avatarSeed: 'none',
    beers: 0,
    socketID: 'none',
    currentTurn: false,
  };

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    this.roomCode = room;
  }

  log(message: string) {
    console.log(`Sala ${this.roomCode} - ${message}`);
  }

  handleMessage(id: any, value: any, payload: any): void {
    if (value === 'move-to') {
      this.beginVoting();
      handleMoving(this.io, this.roomCode, payload);
    }
    if (value === 'voted-player') {
      this.handleVote(id, payload.player);
      return;
    }
    if (value === 'times-up') {
      if (this.playerGameData) {
        this.log(
          `O tempo do jogador ${payload} acabou.`
        );
        this.playerGameData.find(p => p.nickname === payload)!.hasVotedIn = this.noPlayer;
        this.checkVotingStatus();
      }
    }
  }

  handleVote(socketID: string, votedPlayer: string) {
    const vote = JSON.parse(votedPlayer);
    const whoVoted = this.runtimeStorage.rooms
      .get(this.roomCode)!
      .players.find((player) => player.socketID === socketID);

    this.playerGameData?.forEach((player) => {
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
        this.log(
          `${whoVoted?.nickname} votou em ${player.nickname}, que tem agora ${player.votesReceived} votos no total.`
        );
      }
    });

    this.checkVotingStatus();
  }

  beginVoting() {
    this.log(
      `o jogo 'O Escolhido' foi iniciado. Todos os players desta sala tiveram seus dados de votação zerados.`
    );

    const room = this.runtimeStorage.rooms.get(this.roomCode);

    room?.players.forEach((player) => {
      this.playerGameData.push({
        nickname: player.nickname,
        avatarSeed: player.avatarSeed,
        hasVotedIn: undefined,
        votesReceived: 0,
        canVote: true,
      });
    });

    this.log(
      `${this.playerGameData.length} jogadores se encontram neste jogo.`
    );
  }

  finishVoting() {
    const currentRoom = this.runtimeStorage.rooms.get(this.roomCode);
    const highestVoteCount = this.playerGameData
      .sort((a, b) => b.votesReceived - a.votesReceived)
      .at(0)?.votesReceived;

    const mostVoted = this.playerGameData.filter(
      (p) => p.votesReceived === highestVoteCount
    );

    const names = mostVoted.map((p) => p.nickname);

    names.forEach((name) => {
      const i = currentRoom!.players.findIndex((p) => p.nickname === name);
      if (i !== -1) {
        currentRoom!.players[i].beers += 1;
      } else {
        const j = currentRoom!.disconnectedPlayers.findIndex(
          (p) => p.nickname === name
        );
        currentRoom!.disconnectedPlayers[j].beers += 1;
      }
    });

    console.log(
      `Sala ${this.roomCode} - Todos os votos da sala foram contabilizados. Enviando resultado para os jogadores.`
    );
    this.io.to(this.roomCode).emit('vote-results', JSON.stringify(mostVoted));
  }

  handleDisconnect(id: string): void {
    const disconnectedPlayers = this.runtimeStorage.rooms.get(
      this.roomCode
    )?.disconnectedPlayers;
    const disconnectedPlayerName = disconnectedPlayers?.find(
      (p) => p.socketID === id
    )?.nickname;

    if (disconnectedPlayerName) {
      const i = this.playerGameData.findIndex(
        (player) => player.nickname === disconnectedPlayerName
      );
      if (i > -1) {
        this.log(
          `Sala ${this.roomCode} - o jogador ` +
            this.playerGameData[i].nickname +
            ' desconectou-se e não pode mais votar.'
        );

        if (this.playerGameData[i].hasVotedIn === undefined) {
          this.playerGameData[i].hasVotedIn = this.noPlayer;
        }

        this.checkVotingStatus();
      } else {
        this.log(
          `Algo deu errado no tratamento da desconexão do jogador. disconnectedPlayerName: ${disconnectedPlayerName}`
        );
        console.log(this.playerGameData);
      }
    }
  }

  checkVotingStatus(): void {
    if (this.playerGameData.find((player) => player.hasVotedIn === undefined)) {
      return;
    } else {
      this.finishVoting();
    }
  }
}

export { OEscolhido };
