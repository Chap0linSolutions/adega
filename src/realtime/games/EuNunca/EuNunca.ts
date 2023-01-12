import { Server } from 'socket.io';
import Game from '../Game';

class EuNunca extends Game {
  playerGameData: any;
  gameName = 'Eu Nunca';
  gameType = 'dynamic';

  static standardSuggestions = [
    ' quebrei alguma coisa de alguém e deixei de contar',
    ' invadi o Facebook do amiguinho',
    ' comi algo que caiu no chão',
    ' peguei dinheiro emprestado mas nunca devolvi',
    ' pedi um lanche em um restaurante e fui comer em outro',
    ' joguei no computador durante a aula',
    ' fingi que estava doente para faltar a um compromisso',
    ' dei match com um amigo no tinder',
    ' me escondi quando vi uma barata',
    ' virei a noite assistindo série',
    ' xinguei durante o sexo',
    ' falei palavrão perto de uma criança',
    ' fiz xixi nas calças',
    ' fui a um motel',
    ' beijei alguém do mesmo sexo',
  ];

  constructor(io: Server, room: string) {
    super(io, room);
    console.log('Eu Nunca!');

    this.playerGameData = EuNunca.standardSuggestions;
  }

  getSuggestions() {
    const sugs = this.playerGameData
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const suggests = [
      'EU NUNCA' + sugs[0],
      'EU NUNCA' + sugs[1],
      'EU NUNCA' + sugs[2],
    ];
    return suggests;
  }

  static getStandardSuggestions() {
    const sugs = EuNunca.standardSuggestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const suggests = [
      'EU NUNCA' + sugs[0],
      'EU NUNCA' + sugs[1],
      'EU NUNCA' + sugs[2],
    ];
    return suggests;
  }

  handleDisconnect(id: string): void {
    console.log('Player disconnected');
  }
  handleMessage(id: any, value: any, payload: any): void {
    console.log('Message received');
  }
}

export { EuNunca };
