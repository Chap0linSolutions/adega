export const gameList = [
  'Bang Bang',
  //'Bicho Bebe',
  'Buzz',
  'C, S, Composto',
  // 'Direita-Esquerda',
  'Eu Nunca',
  'Medusa',
  'O Escolhido',
  //'Pensa Rápido',
  'Vrum',
  'Titanic',
  'Quem Sou Eu',
  'Qual O Desenho',
  'Jogo do Desafio',
  'Jogo da Verdade',
  'Mestre da Mímica',
  'Linha do Tempo',
];

export type GameListOptionType = {
  name: string;
  counter: number;
};

export type OptionsType = {
  maxPlayers?: number;
  minPlayers?: number;
  gamesList: GameListOptionType[];
};

export const defaultGameList = gameList.map((game) => ({
  name: game,
  counter: 0,
}));
