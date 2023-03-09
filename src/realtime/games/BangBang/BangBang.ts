import { Server } from 'socket.io';
import Game from '../game';
import { handleMoving } from '../../index';

type bangbangData = {
  id: string;
  nickname: string;
  avatarSeed: string;
  shotTime: number;
  ready: boolean;
};

class BangBang extends Game {
  playerGameData: bangbangData[];
  gameName = 'Bang Bang';
  gameType = 'round';

  constructor(io: Server, room: string) {
    super(io, room);
    this.playerGameData = [];
    console.log('Bang Bang!');
  }


  log(message: string){
    console.log(`Sala ${this.roomCode} - ${message}`);
  }


  beginShooting(){
    this.log(`O jogo '${this.gameName}' foi iniciado.`);
    const room = this.runtimeStorage.rooms.get(this.roomCode);

    room?.players.forEach((player) => {
      this.playerGameData.push({
        id: player.socketID,
        nickname: player.nickname,
        avatarSeed: player.avatarSeed,
        shotTime: 0,
        ready: false,
      });
    });

    this.log(`${this.playerGameData.length} jogadores se encontram neste jogo.\n`);
  }


  // Add players and Start game
  public checkForGameStart(id: any) {
    try{
      this.playerGameData.find(p => p.id === id)!.ready = true;
    } catch (e) {
      this.log(`Algo deu errado ao mudar o estado 'ready' do jogador de ID ${id}.`);
      return this.log(`${e}`);
    }

    if(this.playerGameData.filter(p => !p.ready).length === 0){
      this.log('Todos os jogadores estão prontos.');
      this.io.to(this.roomCode).emit('message', { message: 'start_timer' });
    }
  }

  checkForGameConclusion(){
    const everyoneHasFired = (this.playerGameData
      .filter(p => p.shotTime === 0)
      .length === 0
    );
    if (everyoneHasFired) {
      this.finish();
      return true;
    } return false;
  }


  handleMessage(id: any, value: any, payload: any) {
    if (value === 'move-to') {
      this.beginShooting();
      return handleMoving(this.io, this.roomCode, payload);
    }

    if (value === 'player_ready') {
      return this.checkForGameStart(id);
    }

    if (value === 'shot') {
      this.log(`${this.playerGameData.find(p => p.id === id)?.nickname} atirou!`);
      return this.handleShot(id, payload);
    }
  }


  // Gameplay
  handleShot(id: string, payload: any) {
    try {
      this.playerGameData.find(p => p.id === id)!.shotTime = payload.time;
      this.playerGameData.sort((a, b) => b.shotTime - a.shotTime);
      if(!this.checkForGameConclusion()){
        const partialRanking = this.playerGameData
        .filter(p => p.shotTime >= -10000 && p.shotTime !== 0);
        this.io.to(this.roomCode).emit('message', {
        message: 'bangbang_result',
        ranking: partialRanking,
      });
      }
    } catch (e) {
      this.log(`Algo deu errado ao computar o tempo de tiro do jogador de ID ${id}.`);
      return this.log(`${e}`);
    }
  }


  handleDisconnect(id: string): void {
    const index = this.playerGameData.findIndex((p) => p.id === id);
    if(index > -1){
      this.log(`O jogador ${this.playerGameData[index].nickname} desconectou-se e não poderá mais voltar nesta rodada.`);
      this.playerGameData[index]!.shotTime = -20000;
      this.checkForGameConclusion();
    } else {
      this.log(`O jogador de id ${id} não está na partida (wtf?).`);
      console.log(this.playerGameData);
    }
  }


  finish() {
    this.log('Fim de jogo!');
    try {
      const whoShotOnTime = this.playerGameData.filter(p => p.shotTime > -10000);
      const whoDidnt = this.playerGameData.filter(p => p.shotTime === -10000);
      
      const firstToShoot = whoShotOnTime[0];
      const lastToShoot = (whoShotOnTime.length > 1)? whoShotOnTime.at(-1) : undefined;

      if(firstToShoot){
        this.log(`${firstToShoot.nickname} é o vencedor.`);
      }

      if(lastToShoot){
        this.log(`${lastToShoot.nickname} bebe (último a atirar).`);
        this.addBeer(lastToShoot);
      }
      whoDidnt.forEach(p => {
        this.log(`${p.nickname} bebe (queimou a largada / não atirou a tempo).`);
        this.addBeer(p);
      })

      this.log('Enviando resultados aos jogadores.');
      console.log('');
      this.io.to(this.roomCode).emit('message', {
        message: 'bangbang_ranking',
        ranking: this.playerGameData.filter(p => p.shotTime > -20000),
      });

    } catch (e) {
      this.log(`Algo deu errado ao computar os perdedores.`);
      return this.log(`${e}`);
    }
  }


  addBeer(whoDrinks: bangbangData){
    const room = this.runtimeStorage.rooms.get(this.roomCode);
    if(room){
      const index = room.players.findIndex(p => p.nickname === whoDrinks.nickname);
      if(index > -1){
        room.players[index]!.beers += 1;
      } else {
        room.disconnectedPlayers.find(p => p.nickname === whoDrinks.nickname)!.beers += 1;
      }
    }
  }
}

export { BangBang };