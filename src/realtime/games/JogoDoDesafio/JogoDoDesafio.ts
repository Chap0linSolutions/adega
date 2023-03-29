import { Server } from 'socket.io';
import Game from '../game';

class JogoDoDesafio extends Game {
  playerGameData: any;
  gameName = 'Jogo do Desafio';
  gameType = 'dynamic';

  static suggestions: string[] = [
    'Troque de roupa com uma pessoa da roda.',
    'Conte o enredo do seu filme ou série preferido com a língua para fora.',
    'Deixe uma pessoa da roda retocar a sua maquiagem (se estiver sem, permita que alguém o(a) maquie).',
    'Ligue para um amigo(a) que não está fazendo aniversário para dar os parabéns.',
    'Role a tela da lista de telefone do seu celular até alguém mandar parar. Você terá que decidir se ligará para a pessoa ou excluirá o número.',
    'Imite todos os gestos da pessoa ao seu lado por 5 minutos.',
    'Faça uma massagem no pé de uma das pessoas da roda.',
    'Diga um defeito de cada um dos participantes do jogo.',
    'Abra o TikTok e faça a primeira dancinha que surgir no feed.',
    'Curta os 5 posts mais antigos da primeira pessoa que aparecer em seu feed do Instagram.',
    'Coloque um cubo de gelo em uma xícara ou copo pequeno e tente pegar com a língua.',
    'Fique por 5 rodadas em uma posição escolhida pelo grupo.',
    'Passe hidratante em suas mãos de forma sensual.',
    'Cante o seu funk pesadão favorito.',
    'Mostre como você flerta trocando olhares com alguém da roda.',
    'Cheire as axilas da pessoa à sua direita.',
    'Faça uma apresentação de dança do ventre.',
    'Ligue para um amigo e diga que está grávida ou que vai ser pai.',
    'Mande uma mensagem ousada para algum contato do seu celular "acidentalmente".',
    'Encoste a língua na ponta do nariz.',
    'Alguém do grupo irá escrever algo no seu corpo com uma caneta permanente.',
    'Cante uma música de funk como se fosse uma ópera.',
    'Dance alguma música que o grupo escolher.',
    'Faça o quadradinho de oito (ou tente!).',
    'Faça uma mímica descrevendo seu filme favorito para que o grupo adivinhe.',
    'Fale com um sotaque diferente pelo resto do jogo.',
    'Finja ser um gato e se esfregue em todas as pessoas do grupo.',
    'Ligue para o quinto contato da lista do seu telefone e cante um trecho de uma música que o grupo escolher.',
    'Crie um rap sobre sua situação amorosa atual.',
    'Ligue para uma lanchonete ou pizzaria e tente desabafar com o atendente, dizendo que seu namorado ou namorada terminou contigo.',
    'Mande uma imagem aleatória por mensagem para o seu pai ou mãe e espere a resposta.',
    'Ligue para o ex ou para a ex e diga “Oi, sumido(a)”',
    'Mostre para o grupo as cinco últimas fotos da galeria do seu celular.',
    'Peça ou compre alguma comida para o grupo.',
    'Ser vendado, passar a mão no rosto de cada participante e dizer quem é sem errar.',
    'Coloque um fone com música alta, enquanto as outras pessoas no grupo fazem três perguntas que devem ser respondidas com “sim” ou “não”.',
    'Comente a primeira foto de uma pessoa que você segue no Instagram (não vale pessoas famosas).',
    'Ligue para alguém que conhece e comece a pedir desculpas sem dizer o motivo.',
  ];

  constructor(io: Server, room: string) {
    super(io, room);
    console.log('Jogo do Desafio');

    this.playerGameData = JogoDoDesafio.suggestions;
  }

  getSuggestions() {
    const sugs = JogoDoDesafio.suggestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    return sugs;
  }

  handleDisconnect(id: string): void {
    console.log(`${id} - Player disconnected`);
  }

  handleMessage(id: any, value: any): void {
    if (value === 'get-suggestions') {
      console.log('Veio buscar as sugestões do Jogo do Desafio');
      const savedSuggestions = this.getSuggestions();
      this.io.to(this.roomCode).emit('get-suggestions', savedSuggestions);
    }

    if (value === 'show-suggestions') {
      console.log('Revelando sugestões');
      this.io.to(this.roomCode).emit('show-suggestions');
    }
  }
}

export { JogoDoDesafio };
