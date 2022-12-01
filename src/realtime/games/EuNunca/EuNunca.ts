class EuNunca {
  static suggestions: string[] = [
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
