
export enum GemColor {
  White = 'White', // Ha
  Blue = 'Blue',   // Park
  Green = 'Green', // Na
  Red = 'Red',     // Kim
  Black = 'Black', // Lee
  Gold = 'Gold',   // Auth
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
  id: number; // Board Index
  uid?: string; // Firebase Auth UID
  isAI: boolean;
  name?: string; 
  photoURL?: string; // Profile Picture
  vacations?: number; // Total accumulated vacations (Rank)
  tokens: Record<GemColor, number>;
  cards: Card[]; 
  reserved: Card[]; 
  nobles: Noble[];
  points: number;
}

export interface GameState {
  roomId?: string;
  status?: 'waiting' | 'playing' | 'finished';
  hostId?: string; // Player 0 UID
  
  // New Settings
  maxPlayers: number; // 2, 3, 4, or 0 (Any)
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
  // Current Season Stats (Reset on rotation)
  seasonNum: number;
  seasonStartDate: number;
  vacations: number;
  totalGames: number;
  
  // Lifetime Stats (Preserved)
  lifetimeGames: number;
  lifetimeWins: number;
  lifetimeVacations: number;
  
  // Best Record
  bestRankId: number;      // ID from RANK_SYSTEM
  bestRankSeason: number;  // Season Number
  bestRankCount: number;   // How many times reached
  
  lastGameId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  stats: SeasonStats; // Extended stats
}
