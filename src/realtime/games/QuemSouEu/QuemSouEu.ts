import { Server } from 'socket.io';
import Game from '../game';
import { player } from '../../store';
import { animais } from './names';


type whoPlayer = {
    player: string,
    whoPlayerIs: string,
}

class QuemSouEu extends Game {
    playerGameData: player[];
    playersWithNames: whoPlayer[];
    names: string[] | undefined;

    constructor(io: Server, room: string){
        super(io, room);
        this.playerGameData = this.runtimeStorage.rooms.get(room)
        ?.players as player[];
        this.playersWithNames = [];
        this.names = undefined;
        this.roomCode = room;

        console.log(
            `Sala ${this.roomCode} - o jogo 'Quem Sou Eu' foi iniciado. Aguardando os jogadores selecionarem a categoria.`
          );
    }
    
    private setCategory(name: string){
        switch(name){
            case 'Animais':
                this.names = animais; 
                console.log(`Sala ${this.roomCode} - Categoria "${name}" definida.`);
            break;
            default:
                console.log(`Sala ${this.roomCode} - Erro! A categoria "${name}" não existe.`)
                this.names = undefined;
            return;
        } 
    }

    private pickNameFor(player: string) {       
        if(this.names){
            if(this.playersWithNames.map(pwn => pwn.player).includes(player)){
                console.log(`Sala ${this.roomCode} - O jogador "${player}" já possui um nome.`);
                return;
            }

            const namesInUse = this.playersWithNames.map(p => p.whoPlayerIs);

            while(true){
                const name = this.names[Math.floor(this.names.length*Math.random())];
                if(!namesInUse.includes(name)){
                    this.playersWithNames.push({player: player, whoPlayerIs: name});
                    return;
                }
            }
        }
    }

    private leaveNameOf(player: string){
        const playersNames = this.playersWithNames.map(p => p.player);
        const i = playersNames.indexOf(player);
        if(i >= 0){
            return this.playersWithNames.splice(i, 1);
        } return console.log(`Sala ${this.roomCode} - Erro! O jogador "${player}" não está com nenhum nome alocado para si.`);
    }

    private updatePlayersAndNames(){
        console.log(`Sala ${this.roomCode} - Jogadores e nomes:`);
        console.log(this.playersWithNames);
        this.io
        .to(this.roomCode)
        .emit('players-and-names-are', JSON.stringify(this.playersWithNames));
    }

    handleMessage(id: any, value: any, payload: any): void {
        if(value === 'send-names'){
            const playersWithNoNames:string[] = JSON.parse(payload);
            console.log(`Sala ${this.roomCode} - Os seguintes jogadores não têm nome ainda:`);
            console.log(playersWithNoNames);

            playersWithNoNames.forEach(player => this.pickNameFor(player));
            this.updatePlayersAndNames();
            return;
        }
        
        if(value === 'game-category-is'){  
            this.setCategory(payload);
            return;
        }

        if(value === 'winners-are'){
            console.log(`Sala ${this.roomCode} - Os vencedores foram definidos:`);
            console.log(JSON.parse(payload));
            this.io.to(this.roomCode).emit('winners-are', payload);
            return;
        }
    }

    handleDisconnect(id: string): void {
        console.log(`User ${id} has disconnected`);
    }
  }
  
  export { QuemSouEu };
  






































    // static getSuggestions() {
    //   const sugs = QuemSouEu.animais
    //     .sort(() => 0.5 - Math.random())
    //     .slice(0, 3);
    //   const suggests = [
    //     'EU NUNCA' + sugs[0],
    //     'EU NUNCA' + sugs[1],
    //     'EU NUNCA' + sugs[2],
    //   ];
    //   return suggests;
    //}