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
  teams: Team[];
  currentRound: number;
  totalRounds: number;
  currentTeamIndex: number;
  excludedCategories: string[];
  selectedDifficulties: string[];
  isGameStarted: boolean;
  isGameOver: boolean;
  turnDuration: number;
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
  "Place",
  "Food & Drink"
] as const;

export const DIFFICULTIES = [
  "Easy",
  "Medium",
  "Hard"
] as const;

export const TURN_DURATIONS = [5, 15, 30, 45] as const;
export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type Category = typeof CATEGORIES[number];
export type Difficulty = typeof DIFFICULTIES[number];
export type TurnDuration = typeof TURN_DURATIONS[number];
export type RoundCount = typeof ROUND_OPTIONS[number];

export const gameStateSchema = z.object({
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
  selectedDifficulties: z.array(z.string()),
  isGameStarted: z.boolean(),
  isGameOver: z.boolean(),
  turnDuration: z.number()
});