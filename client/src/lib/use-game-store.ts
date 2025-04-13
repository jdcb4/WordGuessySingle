import { create } from 'zustand';
import { GameState, Team, TurnResult, WordResult } from '@shared/schema';

interface GameStore extends GameState {
  initializeGame: (
    teams: Team[],
    includedCategories: string[],
    turnDuration: number,
    totalRounds: number,
    includedDifficulties: string[],
    freeSkips: number,
    freeHints: number
  ) => void;
  updateTeamScore: (teamId: number, points: number) => void;
  nextTeam: () => void;
  nextRound: () => void;
  endGame: () => void;
  addTurnResult: (result: { teamId: number; score: number; words: WordResult[] }) => void;
  reset: () => void;
}

const initialState: GameState = {
  teams: [],
  currentRound: 1,
  totalRounds: 3,
  currentTeamIndex: 0,
  includedCategories: [],
  includedDifficulties: ["Easy", "Medium"],
  isGameStarted: false,
  isGameOver: false,
  turnDuration: 30,
  freeSkips: 1,
  freeHints: 1
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initializeGame: (teams, categories, duration, rounds, difficulties, freeSkips, freeHints) => {
    console.log('[Store] initializeGame received:', { freeSkips, freeHints });

    set({
      teams: teams.map(t => ({ ...t, score: 0, roundScores: [] })),
      includedCategories: categories,
      turnDuration: duration,
      totalRounds: rounds,
      currentRound: 1,
      currentTeamIndex: 0,
      isGameStarted: true,
      isGameOver: false,
      includedDifficulties: difficulties,
      freeSkips: freeSkips,
      freeHints: freeHints,
    });

    const currentState = get();
    console.log('[Store] State IMMEDIATELY after set in initializeGame:', {
      freeSkips: currentState.freeSkips,
      freeHints: currentState.freeHints
    });
  },

  updateTeamScore: (teamId, points) => set(state => ({
    teams: state.teams.map(team =>
      team.id === teamId ? {
        ...team,
        score: team.score + points,
        roundScores: [...team.roundScores, points]
      } : team
    )
  })),

  nextTeam: () => set(state => {
    const nextIndex = (state.currentTeamIndex + 1) % state.teams.length;
    const isRoundComplete = nextIndex === 0;
    const nextRound = isRoundComplete ? state.currentRound + 1 : state.currentRound;
    const isLastRound = nextRound > state.totalRounds;

    return {
      currentTeamIndex: isLastRound ? state.currentTeamIndex : nextIndex,
      currentRound: nextRound,
      isGameOver: isLastRound
    };
  }),

  nextRound: () => set(state => ({
    currentRound: state.currentRound + 1,
    currentTeamIndex: 0
  })),

  endGame: () => set({ isGameOver: true }),

  addTurnResult: (result) => {
    const state = get();
    const team = state.teams.find(t => t.id === result.teamId);
    if (team) {
      set(state => ({
        teams: state.teams.map(t =>
          t.id === result.teamId ? {
            ...t,
            score: t.score + result.score,
            roundScores: [...t.roundScores, result.score]
          } : t
        )
      }));
    }
  },

  reset: () => set(initialState)
}));

export type GameState = {
  teams: Team[];
  currentRound: number;
  totalRounds: number;
  currentTeamIndex: number;
  includedCategories: string[];
  includedDifficulties: string[];
  isGameStarted: boolean;
  isGameOver: boolean;
  turnDuration: number;
  freeSkips: number;
  freeHints: number;
};