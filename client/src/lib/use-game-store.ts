import { create } from 'zustand';
import { GameState, Team, TurnResult } from '@shared/schema';

interface GameStore extends GameState {
  initializeGame: (
    teams: Team[],
    includedCategories: string[],
    turnDuration: number,
    totalRounds: number,
    includedDifficulties: string[]
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
  includedCategories: [],
  includedDifficulties: ["Easy", "Medium"],
  isGameStarted: false,
  isGameOver: false,
  turnDuration: 30
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initializeGame: (teams, includedCategories, turnDuration, totalRounds, includedDifficulties) => set({
    teams,
    includedCategories,
    includedDifficulties,
    turnDuration,
    totalRounds,
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