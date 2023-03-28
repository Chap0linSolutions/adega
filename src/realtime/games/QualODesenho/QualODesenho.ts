import { Server } from 'socket.io';
import Game from '../game';
import { categories } from './words';

type whoPlayer = {
    player: string;
    whoPlayerIs: string;
};

class QualODesenho extends Game {
    gameName = 'Qual O Desenho';
    gameType = 'round';
    word: string | undefined;
    playerGameData: whoPlayer[];
    winners: string[] | undefined;

    constructor(io: Server, room: string) {
        super(io, room);
        this.playerGameData = [];
        this.winners = undefined;
        this.roomCode = room;
        this.word = undefined;
        this.log(`${this.gameName}!`);
        this.log(`Aguardando o jogador da vez selecionar uma palavra.`);
    }

    log(message: string) {
        console.log(`Sala ${this.roomCode} - ${message}`);
    }

    sendWordOptions(id: any) {
        const suggestions = this.getWordSuggestions();
        this.io.to(id).emit('que-desenho-suggestions', suggestions);
    }

    getWordSuggestions(num = 2) {
        let suggestionsPool: string[] = [];
        categories.forEach((wordList) => {
            suggestionsPool = suggestionsPool.concat(wordList)
        });

        const suggestions = suggestionsPool
            .sort(() => 0.5 - Math.random())
            .slice(0, num);

        return suggestions;
    }

    updateWinners(payload: any) {
        throw new Error('Method not implemented.');
    }

    finish(winners: string[]) {
        const room = this.runtimeStorage.rooms.get(this.roomCode);
        const losers = room?.players.filter(
            (player) => !winners.includes(player.nickname)
        );
        losers && losers.forEach((loser) => (loser.beers += 1));

        this.log(`Jogo encerrado.`);
        this.log(`Quem ganhou: ${winners}`);
        this.log(`Quem bebeu:${losers?.map((loser) => ` ${loser.nickname}`)}`);
    }

    private setWord(word: string) {
        this.word = word;
        this.log(`Palavra "${word}" definida.`);
        this.io.to(this.roomCode).emit('game-word-is', word);
        return true;
    }

    handleMessage(id: any, value: any, payload: any): void {
        if (value === 'que-desenho-suggestions') {
            this.sendWordOptions(id);
            return;
        }

        if (value === 'game-word-is') {
            this.setWord(payload);
            return;
        }

        if (value === 'start-game'){
            this.io.to(this.roomCode).emit('start-game');
            return;
        }

        if (value === 'update-me') {
            const whoAsked = this.runtimeStorage.rooms
                .get(this.roomCode)
                ?.players.find((p) => p.socketID === id);
            this.log(
                `O jogador ${whoAsked?.nickname} chegou no meio do jogo e pediu para ser atualizado.`
            );
            this.io.to(id).emit('game-word-is', this.word);
            return;
        }

        if (value === 'correct-guess') {
            this.updateWinners(payload);
            return;
        }

        if (value === 'winners-are') {
            if (this.winners) this.finish(this.winners);
            this.io.to(this.roomCode).emit('winners-are', this.winners);
            return;
        }

        if(value === 'drawing-points'){
            this.io.to(this.roomCode).emit('drawing-points', payload);
        }
    }

    handleDisconnect(id: string): void {
        const room = this.runtimeStorage.rooms.get(this.roomCode);
        const whoLeft = room?.disconnectedPlayers.find(
            (p) => p.socketID === id
        )?.nickname;
        this.log(`${whoLeft} saiu do jogo.`);
    }
}

export { QualODesenho };