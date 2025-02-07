import { create } from 'zustand';
import { GameState, Team, TurnResult, WordResult } from '@shared/schema';

interface GameStore extends GameState {
  initializeGame: (teams: Team[], excludedCategories: string[], turnDuration: number) => void;
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
  currentTeamIndex: 0,
  excludedCategories: [],
  isGameStarted: false,
  isGameOver: false,
  turnDuration: 60
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initializeGame: (teams, excludedCategories, turnDuration) => set({
    teams,
    excludedCategories,
    turnDuration,
    isGameStarted: true,
    currentRound: 1,
    currentTeamIndex: 0
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
    // Check if we're at the end of the game
    const isLastRound = state.currentRound === 3;
    const isLastTeam = state.currentTeamIndex === state.teams.length - 1;

    if (isLastRound && isLastTeam) {
      return {
        isGameOver: true,
        currentTeamIndex: state.currentTeamIndex,
        currentRound: state.currentRound
      };
    }

    // Calculate next team index
    const nextIndex = (state.currentTeamIndex + 1) % state.teams.length;
    const isRoundComplete = nextIndex === 0;

    return {
      currentTeamIndex: nextIndex,
      currentRound: isRoundComplete ? state.currentRound + 1 : state.currentRound,
      isGameOver: false
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