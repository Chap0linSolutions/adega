import { Server } from 'socket.io';
import Game from '../game';
import { player } from '../../store';

type votingSession = {
  nickname: string;
  avatarSeed: string;
  hasVotedIn: player | undefined;
  votesReceived: number;
  canVote: boolean;
};

type mostVoted = {
  nickname: string;
  avatarSeed: string;
  votes: number;
};

class OEscolhido extends Game {
  gameName = 'O Escolhido';
  gameType = 'round';
  playerGameData: player[];
  session: votingSession[];
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
    this.playerGameData = this.runtimeStorage.rooms.get(room)
      ?.players as player[];
    this.session = [];
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

    this.checkVotingStatus(); //verifica se já pode finalizar a votação - e o faz em caso afirmativo
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
        canVote: true,
      });
    });

    console.log(`Sala ${this.roomCode} - ${players.length} jogadores se encontram neste jogo.\n`);
    this.session = players;
  }

  finishVoting() {
    const currentRoom = this.runtimeStorage.rooms.get(this.roomCode);
    const highestVoteCount = this.session
      .sort((a, b) => b.votesReceived - a.votesReceived)
      .at(0)?.votesReceived;

    const mostVoted = this.session
      .filter(p => p.votesReceived === highestVoteCount)
    
    const names = mostVoted.map(p => p.nickname);

    names.forEach(name => {
      const i = currentRoom!.players.findIndex(p => p.nickname === name); 
      if(i !== -1){
        currentRoom!.players[i].beers += 1; 
      } else {
        const j = currentRoom!.disconnectedPlayers.findIndex(p => p.nickname === name);
        currentRoom!.disconnectedPlayers[j].beers += 1;
      }
    });

    console.log(
      `Sala ${this.roomCode} - Todos os votos da sala foram contabilizados. Enviando resultado para os jogadores.`
    );
    this.io
      .to(this.roomCode)
      .emit('vote-results', JSON.stringify(mostVoted));
  }

  handleDisconnect(id: string): void {
    const disconnectedPlayers = this.runtimeStorage.rooms.get(
      this.roomCode
    )?.disconnectedPlayers;
    const disconnectedPlayerName = disconnectedPlayers?.find(
      (p) => p.socketID === id
    )?.nickname;

    if (disconnectedPlayerName) {
      const i = this.session.findIndex(
        (player) => player.nickname === disconnectedPlayerName
      );
      console.log(
        `Sala ${this.roomCode} - o jogador ` +
          this.session[i].nickname +
          ' desconectou-se e não pode mais votar.'
      );

      if (this.session[i].hasVotedIn === undefined) {
        this.session[i].hasVotedIn = this.noPlayer;
      }

      this.checkVotingStatus();
    }
  }

  checkVotingStatus(): void {
    //finaliza a votação caso todos os jogadores disponíveis já tiverem votado
    if (this.session.find((player) => player.hasVotedIn === undefined)) {
      return;
    } else {
      this.finishVoting(); //se todos já votaram, prosseguimos com os resultados
    }
  }
}

export { OEscolhido };
