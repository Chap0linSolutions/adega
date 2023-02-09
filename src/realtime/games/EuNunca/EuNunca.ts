import { Server } from 'socket.io';
import Game from '../game';

class EuNunca extends Game {
  playerGameData: any;
  gameName = 'Eu Nunca';
  gameType = 'dynamic';

  static standardSuggestions = [
    ' quebrei alguma coisa de alguém e deixei de contar',
    ' invadi o Facebook do amiguinho',
    ' comi algo que caiu no chão',
    ' peguei dinheiro emprestado e nunca devolvi',
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
    ' peguei carona com estranhos',
    ' quebrei um dente',
    ' fiquei preso no elevador',
    ' me arrependi logo depois de enviar uma mensagem',
    ' passei mais de dois dias sem tomar banho',
    ' usei Crocs',
    ' entrei de penetra em uma festa',
    ' menti para alguém sobre meu nome',
    ' pesquisei meu próprio nome no Google',
    ' apaguei uma postagem porque ela flopou',
    ' dei conselho ruim para alguém de propósito',
    ' terminei com alguém por mensagem',
    ' sumi depois do primeiro encontro',
    ' peguei ou namorei alguém para tentar esquecer outra pessoa',
    ' dirigi bêbado(a)',
    ' tive um sonho quente com alguém da roda',
    ' precisei sair carregado de uma festa',
    ' mandei a figurinha errada do Whatsapp',
    ' fiquei com alguém sem nem saber o nome',
    ' dancei sobre a mesa',
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
    console.log(`Player ${id} disconnected`);
  }
  handleMessage(id: any, value: any, payload: any): void {
    console.log('Message received');
    console.log(`id: ${id}\tvalue: ${value}\tpayload: ${payload}`);
    //TODO: adicionar maneira de transmitir qual tela do eu nunca a pessoa estava

    //TODO: transferir a lógica de enviar as sugestões para dentro do handle_message
  }
}

export { EuNunca };
