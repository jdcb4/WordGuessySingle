import { create } from 'zustand';
import { GameState, Team, TurnResult } from '@shared/schema';

interface GameStore extends GameState {
  initializeGame: (
    teams: Team[],
    excludedCategories: string[],
    selectedDifficulties: string[],
    turnDuration: number,
    totalRounds: number
  ) => void;
  updateTeamScore: (teamId: number, points: number) => void;
  nextTeam: () => void;
  nextRound: () => void;
  endGame: () => void;
  addTurnResult: (result: TurnResult) => void;
  reset: () => void;
}

const initialState: GameState = {
  teams: [],
  currentRound: 1,
  totalRounds: 3,
  currentTeamIndex: 0,
  excludedCategories: [],
  selectedDifficulties: ["Easy"],
  isGameStarted: false,
  isGameOver: false,
  turnDuration: 30
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initializeGame: (teams, excludedCategories, selectedDifficulties, turnDuration, totalRounds) => set({
    teams,
    excludedCategories,
    selectedDifficulties,
    turnDuration,
    totalRounds,
    isGameStarted: true,
    currentRound: 1,
    currentTeamIndex: 0,
    isGameOver: false
  }),

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
    // Calculate next team index
    const nextIndex = (state.currentTeamIndex + 1) % state.teams.length;
    const isRoundComplete = nextIndex === 0;

    // Only increment round if we've gone through all teams
    const nextRound = isRoundComplete ? state.currentRound + 1 : state.currentRound;

    // Check if game should end
    const shouldEndGame = nextRound > state.totalRounds;

    return {
      currentTeamIndex: shouldEndGame ? state.currentTeamIndex : nextIndex,
      currentRound: shouldEndGame ? state.currentRound : nextRound,
      isGameOver: shouldEndGame
    };
  }),

  nextRound: () => set(state => {
    const nextRound = state.currentRound + 1;
    return {
      currentRound: nextRound,
      currentTeamIndex: 0,
      isGameOver: nextRound > state.totalRounds
    };
  }),

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