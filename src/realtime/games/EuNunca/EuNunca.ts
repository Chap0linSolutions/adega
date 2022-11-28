
class EuNunca {
  
  static suggestions:string[] = [
    " quebrei alguma coisa de alguém e deixei de contar",
    " invadi o Facebook do amiguinho",
    " comi algo que caiu no chão",
    " peguei dinheiro emprestado mas nunca devolvi",
    " pedi um lanche em um restaurante e fui comer em outro",
    " joguei no computador durante a aula",
    " fingi que estava doente para faltar a um compromisso",
    " dei match com um amigo no tinder",
    " me escondi quando vi uma barata",
    " virei a noite assistindo série",
    " imitei um cachorro durante o sexo",
    " falei palavrão perto de uma criança",
    " fiz xixi nas calças",
    " fui a um motel",
    " beijei alguém do mesmo sexo",

  ]
  
  static getSuggestions() {
    let indexes:number[] = [-1, -1, -1];
    let i = 0;
    while (i < 3){
        while(true){
            let index = Math.floor(Math.random()* EuNunca.suggestions.length);
            if(indexes.indexOf(index) !== -1){
                continue;
            } 
            indexes[i] = index;
            break;
        }
        i += 1;
    }
    const suggests = [
        "EU NUNCA" + EuNunca.suggestions[indexes[0]],
        "EU NUNCA" + EuNunca.suggestions[indexes[1]],
        "EU NUNCA" + EuNunca.suggestions[indexes[2]],
    ]
    return suggests;
  }
}

export { EuNunca };
