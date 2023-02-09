import { Server } from 'socket.io';
import Game from '../game';

class JogoDaVerdade extends Game {
  playerGameData: any;
  gameName = 'Jogo da Verdade';
  gameType = 'dynamic';

  static suggestions: string[] = [
    'Qual foi a coisa mais embaraçosa que você já fez bêbado?',
    'O que você adora, mas tem vergonha de admitir?',
    'Qual foi a razão mais ridícula pela qual terminou com alguém?',
    'Qual site no seu histórico de navegação te deixaria constrangido se alguém visse?',
    'De qual pessoa não famosa você tem inveja?',
    'Qual foi a pessoa mais aleatória que stalkeou nas redes sociais?',
    'Qual foi o pior presente que já deu para alguém?',
    'Qual foi o pior presente que já recebeu de alguém?',
    'Quando foi a última vez que chorou e por quê?',
    'Quantos dias já passou sem tomar banho?',
    'Já traiu algum namorado ou namorada?',
    'Já fez xixi nas calças depois de adulto?',
    'Qual é o apelido mais vergonhoso que alguém já lhe deu?',
    'Qual foi o sonho mais assustador que já teve?',
    'Quem é a pessoa mais bonita da roda?',
    'Se tivesse que beijar um dos jogadores, quem seria?',
    'Conte algo infantil que você ainda faz.',
    'Com quem se arrepende de já ter se envolvido?',
    'Qual é a coisa mais estranha ou vergonhosa que já fez por dinheiro?',
    'Você já fez cocô nas calças em público?',
    'Se pudesse mudar de vida com uma celebridade por um dia, com quem seria?',
    'Qual é a maior mentira que já contou para alguém da sua família?',
    'O que a maioria das pessoas pensa que é verdade sobre você, mas não é?',
    'Qual foi a maior conquista que já teve?',
    'O que você faria se fosse do sexo oposto por um dia?',
    'Qual foi o momento mais inapropriado em que já peidou?',
    'Já se arrependeu imediatamente após enviar uma mensagem? Qual foi?',
    'Por que você terminou com seu último namorado ou namorada?',
    'Qual a foto mais constrangedora que tem no seu telefone?',
    'Se acha bonito(a)?',
    'O que não consegue viver sem?',
    'Quando foi a última vez que não conseguiu chegar a tempo ao banheiro?',
    'Já ficou com alguém do Tinder?',
    'Qual a maior mentira que já contou para algum namorado ou namorada e nunca foi descoberta?',
    'Qual foi a coisa mais embaraçosa que seus pais já pegaram você fazendo?',
    'Qual foi a coisa mais estranha que você já fez em frente ao espelho?',
    'Você já enviou alguma foto comprometedora para a pessoa errada?',
    'Das pessoas nesta sala, com quem você mais gostaria de ficar?',
    'Qual foi o lugar mais esquisito ou curioso em que ficou com alguém?',
    'Quando foi a última vez que te deram um fora e como lidou com isso?',
    'O que você nunca toparia fazer pelo(a) namorado(a)?',
    'Já ficou com algum professor?',
    'O que faria se pegasse seu namorado ou namorada com outro(a)?',
    'Já ficou com o(a) ex-namorado(a) de um(a) amigo(a)?',
    'Já sentiu ranço de alguém nesta sala?',
    'Já foi apaixonado(a) por alguém nesta sala?',
    'Já nadou sem roupa?',
    'Já foi traído(a)?',
    'O que te entrega quando está a fim de alguém?',
    'Qual foi a maior mentira que contou para faltar o trabalho?',
    'Já teve que esconder marcas deixadas no seu pescoço?',
    'Tem alguma tatuagem escondida?',
    'Tem algum piercing em um lugar que não podemos ver?',
    'Qual foi o máximo de tempo que já ficou sem beijar alguém?',
    'Já ficou com alguém sabendo que era comprometido(a)?',
    'Já foi o(a) amante?',
    'Já terminou um relacionamento porque se interessou por outra pessoa?',
    'Já ficou com pai ou mãe de amigo(a)?',
    'Já ficou com primo(a)?',
    'Já acobertou uma traição de um(a) amigo(a) bem próximo(a)?',
    'Se arrepende em quem votou nas últimas eleições para presidente?',
    'Se tivesse que escolher, preferiria saber quando ou como irá morrer?',
    'Entre um amor e uma amizade, o que você escolhe?',
    'Já terminou com alguém e pegou um(a) amigo(a) para fazer ciúmes?',
    'O que você já pegou emprestado e "esqueceu" de devolver de propósito?',
    'Já teve um relacionamento tóxico e só percebeu após terminar?',
    'Acredita que a personalidade do ser humano é determinada no momento do nascimento?',
    'Se considera uma pessoa egoísta?',
    'Já fez terapia?',
    'Já teve inveja de alguém desta roda?',
    'O primeiro amor é o melhor que se tem na vida?',
    'Trocar mensagens nas redes sociais pode ser considerado traição?',
    'Qual o site que você mais acessa quando está sozinho(a)?',
    'Quem desta roda você mandaria para "aquele lugar" agora?',
    'Qual foi a maior mentira que já contou para algum(a) crush?',
    'Você acredita em Deus?',
    'Se considera uma pessoa fofoqueira?',
    'Ter um bebê sem um(a) parceiro(a) ou ter um(a) parceiro(a) sem um bebê?',
    'Os livros são sempre melhores que os filmes em que foram baseados?',
    'Já aceitou namorar alguém por pena ou por ficar sem graça em recusar o pedido?',
    'O que acha de quem mantém amizade com os(as) ex?',
    'Qual foi a a pior decisão que já tomou na vida?',
    'Já ignorou mensagens de alguém desta roda de propósito e fingiu que esqueceu?',
    'Você tem medo de morrer?',
    'Se pudesse, como escolheria morrer?',
    'Acredita em propósito de vida? Pensa que você tem um?',
    'Qual hábito seu podem considerar estranho ou feio?',
    'Acredita em relacionamentos monogâmicos?',
    'Vale tudo por amor?',
    'Você gosta dos seus parentes?',
    'Já brigou por política?',
    'Acredita em extraterrestres?',
    'Já fez mal a alguém de propósito?',
    'Se considera uma pessoa espiritualizada ou religiosa?',
    'Qual a maior loucura que faria por um amigo?',
    'Você acredita em amizade entre pessoas do sexo oposto?',
    'Se você fosse morrer hoje, do que você se arrependeria?',
    'Já viu algum OVNI?',
    'O que te faz sentir mais vulnerável?',
    'Por qual situação difícil já passou que não deseja nem para o seu inimigo?',
    'Adotaria uma criança?',
    'Um milhão de reais e ser sozinho para sempre ou ser pobre rodeado por pessoas?',
    'Já se relacionou com uma pessoa mesmo sabendo que ela era comprometida?',
    'Qual foi a coisa mais fútil com a qual gastou dinheiro?',
    'Qual foi o maior número de pessoas que já beijou em um mesmo dia?',
    'Passa fio dental todos os dias?',
    'Qual foi a cena mais constrangedora em que já pegou seus pais?',
    'Casaria por dinheiro?',
    'Pegaria um ex de algum amigo por dinheiro, mesmo sabendo que isso poderia magoar a pessoa?',
    'Uma verdade que ninguém aceita?',
    'Qual pedido inusitado faria a um gênio da lâmpada?',
    'Deixaria de falar com a pessoa que você mais gosta por dinheiro?',
    'Vazaria algum vídeo seu para ganhar dinheiro?',
    'Teria um sugar daddy/uma sugar mommy?',
    'Do que se arrepende de não ter pedido perdão?',
    'Qual foi o maior boato que já inventaram sobre você?',
    'Qual item do seu quarto você teria vergonha que alguém visse?',
    'A coisa mais louca que já fez entre quatro paredes?',
    'Já teve sonhos apimentados com alguém desta roda? Com quem foi?',
    'Se considera uma pessoa sensual?',
    'Você tem medo de dar a sua opinião?',
    'Preferiria viver um amor de novela ou um amor simples?',
    'Com quem você costuma se comparar de vez em quando?'
  ];

  constructor(io: Server, room: string) {
    super(io, room);
    console.log('Jogo da Verdade');

    this.playerGameData = JogoDaVerdade.suggestions;
  }

  getSuggestions() {
    const sugs = JogoDaVerdade.suggestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    return sugs;
  }

  handleDisconnect(id: string): void {
    console.log('Player disconnected');
  }

  handleMessage(socket: any, value: any, payload: any): void {
    if (value === 'truth-suggestions') {
      console.log("Veio buscar as sugestões do Jogo da Verdade")
      const suggestions = this.getSuggestions();
      socket.emit('truth-suggestions', suggestions);
    }
  }
}

export { JogoDaVerdade };