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
  currentTeamIndex: number;
  excludedCategories: string[];
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
  "Category",
  "Nature", 
  "Person",
  "Random",
  "World"
] as const;

export const TURN_DURATIONS = [5, 15, 30, 45] as const;

export type Category = typeof CATEGORIES[number];
export type TurnDuration = typeof TURN_DURATIONS[number];

export const gameStateSchema = z.object({
  teams: z.array(z.object({
    id: z.number(),
    name: z.string(),
    score: z.number(),
    roundScores: z.array(z.number())
  })),
  currentRound: z.number(),
  currentTeamIndex: z.number(),
  excludedCategories: z.array(z.string()),
  isGameStarted: z.boolean(),
  isGameOver: z.boolean(),
  turnDuration: z.number()
});