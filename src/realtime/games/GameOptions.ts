export const gameList = [
  'Bang Bang',
  'Bicho Bebe',
  'Buzz',
  'C, S, Composto',
  // 'Direita-Esquerda',
  'Eu Nunca',
  'Medusa',
  'O Escolhido',
  'Pensa Rápido',
  'Vrum',
  'Titanic',
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
