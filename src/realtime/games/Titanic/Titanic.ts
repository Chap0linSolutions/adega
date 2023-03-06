import { Server } from 'socket.io';
import Game from '../game';

type titanicSession = {
  nickname: string;
  avatarSeed: string;
  shipPlacement: number[] | undefined;
  hits: number;
};

class Titanic extends Game {
  gameName = 'Titanic';
  gameType = 'round';
  playerGameData: titanicSession[] = [];

  constructor(io: Server, room: string) {
    super(io, room);
    this.roomCode = room;
    this.log('Titanic!'); 
    this.beginGame();
  }

  log(message: string){
    console.log(`Sala ${this.roomCode}: ` + message)
  }

  handleMessage(id: any, value: any, payload: any): void {
    const playerName = this.runtimeStorage.rooms
      .get(this.roomCode)!.players
      .filter(p => p.socketID === id)
      .at(0)?.nickname;

    if(playerName){
      if(value === 'player-has-selected'){
        const parsedPayload:number[] = JSON.parse(payload);
        if(parsedPayload[0] === -100){
          this.log('Acabou o tempo do jogo.');
          this.playerGameData = this.playerGameData.map(p => {
            let didNotPlayOnTime = [-100];                                  //this signalizes that the titanic player didn't play on time
            if (p.nickname === playerName){
              didNotPlayOnTime = [-100, -100, -100, -100, -100];            //this signalizes that the iceberg player didn't play on time
            }
            return {
              ...p,
              shipPlacement: (p.shipPlacement)? p.shipPlacement : didNotPlayOnTime,
            }
          });
          return this.checkForGameConclusion();
        }
        const typeOfShip = (parsedPayload.length > 3)
        ? 'Icebergs'
        : 'Titanics';

        const sectors = parsedPayload.map(p => (p - 100));
        this.log(`O jogador ${playerName} posicionou seus ${typeOfShip} nos setores ${sectors}.`);
        this.playerGameData.find(p => p.nickname === playerName)!.shipPlacement = sectors;
        this.checkForGameConclusion();
      }
    }
  }

  beginGame() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);

    room!.players
      .forEach(player =>
        this.playerGameData.push({
          nickname: player.nickname,
          avatarSeed: player.avatarSeed,
          shipPlacement: undefined,
          hits: 0,
        })
      )

    this.log(`O jogo Titanic foi iniciado. Os dados dos jogadores foram zerados.`);
  }

  checkForGameConclusion(){
    if(this.playerGameData.filter(p => p.shipPlacement === undefined).length === 0){
      this.log(`Jogo encerrado.`);
      this.finishGame(); 
    } else if(this.playerGameData
      .filter(p => p.shipPlacement && p.shipPlacement.length === 1)
      .length === (this.playerGameData.length - 1)){
      this.log('Só sobrou o jogador da vez.');

      this.playerGameData.find(p => p.shipPlacement === undefined)!.shipPlacement = [-200, -200, -200, -200, -200];     //this signalizes that the current turn player was the only one left
      this.finishGame();
    }
  }

  finishGame() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    const whoPlayed = this.playerGameData.filter(p => p.shipPlacement && p.shipPlacement.length > 1);
    const whoDidntPlay = this.playerGameData.filter(p => p.shipPlacement![0] === -100);
    const icebergPlayer = this.playerGameData.find(p => p.shipPlacement!.length > 3)!;
    
    if(icebergPlayer){
      this.playerGameData.forEach(player => {
          player.shipPlacement?.forEach(place => {
            if(icebergPlayer.shipPlacement?.includes(place)){
              player.hits += 1;
            }
          });
      });
    }

    const survivors = whoPlayed.filter(p => p.hits === 0);
    if(whoDidntPlay.length === this.playerGameData.length){
      this.log('NINGUÉM dos que não caíram jogou. Todos esses bebem.');
      whoDidntPlay.forEach(player => {
        try{
          room!.players.find(p => p.nickname === player.nickname)!.beers += 1;
        } catch (e){
          this.log('Erro ao encontrar o jogador ' + player.nickname + '.');
        }
      });
    } else {

      this.log(`Registro de hits:`);
      console.log(this.playerGameData.map(player => {return {name: player.nickname, hits: player.hits}}));
      

      this.playerGameData.forEach(player => {
        const status = player.shipPlacement![0];
        if((status > -200)          
        || ((status !== -1) && (player.hits > 0 && player.hits < 5))
        ){
          this.log(`${player.nickname} bebe.`);
          try {
            room!.players.find(p => p.nickname === player.nickname)!.beers += 1;
          } catch(e) {
            this.log('Erro ao encontrar o jogador ' + player.nickname + '.');
          }
        }
      });

      if(survivors.length > 0 && survivors.length === whoPlayed.length - 1) {
        this.log('O jogador dos icebergs é MUITO ruim e não acertou ninguém. Por isso ele bebe.');
        room!.players.find(p => p.nickname === icebergPlayer.nickname)!.beers += 1;
      }
    }

    const finalResults = this.playerGameData.map((player, i) => {   //wrap up the results
      return {
        nickname: player.nickname,
        avatarSeed: player.avatarSeed,
        shipPlacement: player.shipPlacement,
        hits: player.hits,
      }
    })

    this.log(`Enviando resultados aos jogadores.`);    //send final results
    this.io
      .to(this.roomCode)
      .emit('titanic-results', JSON.stringify(finalResults));

  }

  handleDisconnect(id: string): void {
    const whoLeft = this.runtimeStorage.rooms
      .get(this.roomCode)!.disconnectedPlayers
      .filter(p => p.socketID === id);
    
    this.log(`O jogador ${whoLeft[0].nickname} desconectou-se e não poderá mais participar desta rodada.`);
    const whoLeftIndex = this.playerGameData.findIndex(p => p.nickname === whoLeft[0].nickname);
    if (this.playerGameData[whoLeftIndex].shipPlacement === undefined){
      this.playerGameData[whoLeftIndex].shipPlacement = [-1];     //-1 signalizes that the player has disconnected before participating
    }
    this.checkForGameConclusion();
  }
}

export { Titanic };
