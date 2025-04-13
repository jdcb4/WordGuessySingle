// Keep only the game-related types
export type Team = {
  id: number;
  name: string;
  score: number;
  roundScores: number[];
};

export type WordResult = {
  word: string;
  category: string;
  correct: boolean;
};

export type Category = string;

export type GameState = {
  teams: Team[];
  currentRound: number;
  totalRounds: number;
  currentTeamIndex: number;
  includedCategories: string[];
  isGameStarted: boolean;
  isGameOver: boolean;
  turnDuration: number;
  includedDifficulties: string[];
};

// Game constants
export const CATEGORIES = [
  "Actions",
  "Things",
  "Places",
  "Food & Drink",
  "Entertainment"
] as const;

export const DIFFICULTIES = ['Easy', 'Medium'];

export const TURN_DURATIONS = [15, 30, 45, 60] as const;
export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type Difficulty = typeof DIFFICULTIES[number];
export type TurnDuration = typeof TURN_DURATIONS[number];
export type RoundCount = typeof ROUND_OPTIONS[number];