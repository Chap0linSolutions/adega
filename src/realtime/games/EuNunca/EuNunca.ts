import { Server } from 'socket.io';
import { handleMoving } from '../../index';
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
    ' menti para alguém sobre qual era meu nome',
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
    ' fui expulso da sala de aula',
    ' consegui algo de graça dando em cima de alguém',
    ' dormi no ônibus e perdi o ponto',
    ' fui expulso de uma festa',
    ' quebrei um osso',
    ' chorei em transporte público',
    ' criei uma conta falsa em redes sociais',
    ' viajei para fora do Brasil',
    ' pedi um favor a uma pessoa aleatória da rua',
    ' consegui algo de graça dando em cima de alguém',
    ' cantei karaokê em público',
    ' fugi de alguém',
    ' testemunhei um crime',
    ' tive algo constrangedor meu postado na internet',
    ' bati o mindinho do pé em um móvel',
    ' fiquei com mais de 5 pessoas em uma festa',
    ' confundi um conhecido com um estranho na rua',
    ' me apaixonei por quem eu claramente não devia',
    ' fiquei com pessoas irmãs umas das outras',
    ' entrei no carro errado achando que era o Uber',
    ' dei em cima de alguém comprometido',
    ' desmaiei',
    ' menti que a comida estava boa',
    ' coloquei a culpa em alguém que não estava ali para se defender',
    ' experimentei comida de cachorro',
    ' tive uma conta hackeada',
    ' tive uma experiência paranormal',
    ' treinei beijo de língua com um objeto',
    ' tentei dar um golpe de artes marciais em alguém',
    ' fui enganado por alguém da roda',
    ' colei na prova',
    ' copiei o trabalho ou tarefa de casa de alguém',
    ' tentei cortar meu próprio cabelo',
    ' matei aula',
    ' apareci na TV',
    ' apostei dinheiro com ninguém',
    ' dormi no cinema',
    ' chorei para tentar convencer alguém',
    ' me gabei por algo que não fiz',
    ' fui perseguido por animais',
    ' tive crise de riso em um momento sério',
    ' tive catapora',
    ' andei de kart',
    ' acampei',
    ' pensei na resposta de uma discussão dias depois de ter ocorrido',
    ' pintei meu cabelo',
    ' menti para meus pais sobre onde estava indo',
    ' me perdi',
    ' fui o último a ser escolhido em alguma coisa',
    ' usei a escova de dentes de outra pessoa',
    ' colei chiclete embaixo da mesa',
    ' dei de presente algo que eu ganhei e não gostei',
    ' fiquei com gêmeos',
    ' gostei mais de um filme do que do respectivo livro',
    ' entrei em casa pela janela',
    ' menti no currículo',
    ' caí na porrada com alguém',
    ' fui parado pela polícia', 
    ' ronquei enquanto dormia',
    ' fingi durante o sexo',
    ' fingi que não gostava de algo que na verdade eu adorava',
    ' mandei nudes para a pessoa errada',
    ' virei alvo de fofocas',
    ' dirigi sem ter carteira de motorista',
    ' venci uma partida de bingo',
    ' fiz dieta',
    ' postei vídeo no youtube',
    ' perdi o voo',
    ' aprendi a tocar um instrumento musical',
    ' entendi essa história de Bitcoin',
    ' fiz aula de dança',
    ' reclamei do meu chefe pelas costas',
    ' me demiti',
    ' dei susto em alguém durante um filme de terror',
    ' roubei uma placa ou cone de trânsito',
    ' caí de bicicleta',
    ' competi em um rodízio de pizza',
    ' vi um acidente acontecer ao vivo',
    ' liguei pro Bom Dia e Cia',
    ' fiz uma chantagem',
    ' esqueci de lavar as mãos após usar o banheiro',
    ' dormi no trabalho',
    ' caí da cama',
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

  handleMessage(id: any, value: any): void {
    if (value === 'end-game') {
      return handleMoving(this.io, this.roomCode, '/quembebeu');
    }
    if (value === 'eu-nunca-suggestions') {
      const suggestions = EuNunca.getStandardSuggestions();
      this.io.to(id).emit('eu-nunca-suggestions', JSON.stringify(suggestions));
    }
  }
}

export { EuNunca };
