export const gameList = ['Eu Nunca', 'Roleta', 'Vrum', 'Bicho Bebe', 'Medusa'];

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
