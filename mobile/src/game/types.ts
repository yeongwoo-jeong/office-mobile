export enum GemColor {
  White = 'White',
  Blue = 'Blue',
  Green = 'Green',
  Red = 'Red',
  Black = 'Black',
  Gold = 'Gold',
}

export interface Costs {
  [GemColor.White]?: number;
  [GemColor.Blue]?: number;
  [GemColor.Green]?: number;
  [GemColor.Red]?: number;
  [GemColor.Black]?: number;
}

export interface Card {
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  points: number;
  bonus: GemColor;
  cost: Costs;
}

export interface Noble {
  id: string;
  name: string;
  points: number;
  requirements: Costs;
}

export interface PlayerState {
  id: number;
  uid?: string;
  isAI: boolean;
  name?: string;
  photoURL?: string;
  vacations?: number;
  tokens: Record<GemColor, number>;
  cards: Card[];
  reserved: Card[];
  nobles: Noble[];
  points: number;
}

export interface GameState {
  maxPlayers: number;
  isPublic: boolean;
  players: PlayerState[];
  currentPlayerIndex: number;
  tokens: Record<GemColor, number>;
  decks: {
    1: Card[];
    2: Card[];
    3: Card[];
  };
  visibleCards: {
    1: Card[];
    2: Card[];
    3: Card[];
  };
  nobles: Noble[];
  winner: number | null;
  logs: string[];
  turnCount: number;
}

export type ActionType = 'TAKE_3_DIFF' | 'TAKE_2_SAME' | 'RESERVE' | 'BUY';

export interface GameAction {
  type: ActionType;
  gems?: GemColor[];
  cardId?: string;
}

export interface SeasonStats {
  seasonNum: number;
  seasonStartDate: number;
  vacations: number;
  totalGames: number;
  lifetimeGames: number;
  lifetimeWins: number;
  lifetimeVacations: number;
  bestRankId: number;
  bestRankSeason: number;
  bestRankCount: number;
  lastGameId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  stats: SeasonStats;
}
