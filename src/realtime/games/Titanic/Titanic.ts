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

    this.log(`value: ${value}, payload: ${payload}`);

    if(playerName){
      if(value === 'player-has-selected'){
        const parsedPayload:number[] = JSON.parse(payload);
        const typeOfShip = (parsedPayload.length > 3)
        ? 'Icebergs'
        : 'Titanics';

        const sectors = parsedPayload.map(p => (p - 100));
        this.log(`O jogador ${playerName} posicionou seus ${typeOfShip} nos setores ${sectors}.`);
        this.playerGameData.find(p => p.nickname === playerName)!.shipPlacement = sectors;
        this.checkForGameConclusion();
      }
      if(value === 'time-is-up'){
        for(let i = 0; i < this.playerGameData.length; i++){
          if(!this.playerGameData[i].shipPlacement){
            this.playerGameData[i].shipPlacement = [-1];
          }
        }
        this.checkForGameConclusion();
      }
    }
  }

  beginGame() {
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    const turnName = room?.players
      .filter(player => player.socketID === room?.ownerId)[0]
      .nickname;

    room!.players
      .forEach(player =>
        this.playerGameData.push({
          nickname: player.nickname,
          avatarSeed: player.avatarSeed,
          shipPlacement: undefined,
          hits: 0,
        }) //this guarantees we're not getting a reference, but instead the value itself
      )

    this.log(`O jogo Titanic foi iniciado. Os dados dos jogadores foram zerados.`);
  }

  checkForGameConclusion(){
    if(this.playerGameData.filter(p => p.shipPlacement === undefined).length === 0){
      this.log(`Todos os participantes enviaram suas jogadas.`);
      this.finishGame(); 
    } else if(this.playerGameData
      .filter(p => p.shipPlacement && p.shipPlacement.length === 1)
      .length === (this.playerGameData.length - 1)){
      this.log('Só sobrou o jogador da vez.');

      this.playerGameData.find(p => p.shipPlacement === undefined)!.shipPlacement = [-2, -2, -2, -2, -2];
      this.finishGame();
    }
  }

  finishGame() {
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

    this.log(`Registro de hits:`);
    console.log(this.playerGameData.map(player => {return {name: player.nickname, hits: player.hits}}));

    const players = this.runtimeStorage.rooms.get(this.roomCode);
    this.playerGameData.forEach(player => {
      if(player.hits !== 0 && player.hits < 5){
        this.log(`${player.nickname} bebe.`);
        players!.players.find(p => p.nickname === player.nickname)!.beers += 1;        
      }
    });

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
      this.playerGameData[whoLeftIndex].shipPlacement = [-1];     //this signalizes that the player hasn't participated
    }
    this.checkForGameConclusion();
  }
}

export { Titanic };
