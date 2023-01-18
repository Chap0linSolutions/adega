class EuNunca {
  static suggestions: string[] = [
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

  static getSuggestions() {
    const sugs = EuNunca.suggestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const suggests = [
      'EU NUNCA' + sugs[0],
      'EU NUNCA' + sugs[1],
      'EU NUNCA' + sugs[2],
    ];
    return suggests;
  }
}

export { EuNunca };
