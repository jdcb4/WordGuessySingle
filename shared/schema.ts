import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Types for game state
export type Team = {
  id: number;
  name: string;
  score: number;
  roundScores: number[];
};

export type GameState = {
  gameId: string;  // Added for multiplayer support
  teams: Team[];
  currentRound: number;
  totalRounds: number;
  currentTeamIndex: number;
  excludedCategories: string[];
  isGameStarted: boolean;
  isGameOver: boolean;
  turnDuration: number;
  hostId?: string;  // Added to track the host
};

export type WordResult = {
  word: string;
  category: string;
  correct: boolean;
};

export type TurnResult = {
  teamId: number;
  score: number;
  words: WordResult[];
};

// Game constants
export const CATEGORIES = [
  "Action",
  "Nature",
  "Thing",
  "Person",
  "Random",
  "Place"
] as const;

export const TURN_DURATIONS = [5, 15, 30, 45] as const;
export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type Category = typeof CATEGORIES[number];
export type TurnDuration = typeof TURN_DURATIONS[number];
export type RoundCount = typeof ROUND_OPTIONS[number];

// WebSocket message types
export type WSMessage = {
  type: 'join_game' | 'game_state' | 'start_game' | 'end_turn' | 'next_round' | 'game_over' | 'error' | 'player_joined' | 'player_left';
  payload: any;
};

export type JoinGameMessage = {
  type: 'join_game';
  payload: {
    gameId: string;
  };
};

export type GameStateMessage = {
  type: 'game_state';
  payload: GameState;
};

export type StartGameMessage = {
  type: 'start_game';
  payload: {
    teams: Team[];
    excludedCategories: string[];
    turnDuration: number;
    totalRounds: number;
  };
};

export const gameStateSchema = z.object({
  gameId: z.string(),
  teams: z.array(z.object({
    id: z.number(),
    name: z.string(),
    score: z.number(),
    roundScores: z.array(z.number())
  })),
  currentRound: z.number(),
  totalRounds: z.number(),
  currentTeamIndex: z.number(),
  excludedCategories: z.array(z.string()),
  isGameStarted: z.boolean(),
  isGameOver: z.boolean(),
  turnDuration: z.number(),
  hostId: z.string().optional()
});