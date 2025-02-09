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

  initializeGame: (teams, excludedCategories, selectedDifficulties, turnDuration, totalRounds) => {
    console.log('Initializing game with totalRounds:', totalRounds);
    set({
      teams,
      excludedCategories,
      selectedDifficulties,
      turnDuration,
      totalRounds,
      currentRound: 1,
      currentTeamIndex: 0,
      isGameStarted: true,
      isGameOver: false
    });

    // Verify state was set correctly
    const state = get();
    console.log('Game state after initialization:', {
      totalRounds: state.totalRounds,
      currentRound: state.currentRound
    });
  },

  updateTeamScore: (teamId, points) => set(state => ({
    ...state,
    teams: state.teams.map(team =>
      team.id === teamId ? {
        ...team,
        score: team.score + points,
        roundScores: [...team.roundScores, points]
      } : team
    )
  })),

  nextTeam: () => set(state => {
    console.log('Current state in nextTeam:', {
      currentRound: state.currentRound,
      totalRounds: state.totalRounds,
      teams: state.teams.length
    });

    const nextIndex = (state.currentTeamIndex + 1) % state.teams.length;
    const isRoundComplete = nextIndex === 0;
    const nextRound = isRoundComplete ? state.currentRound + 1 : state.currentRound;

    const isLastRound = nextRound > state.totalRounds;
    const shouldEndGame = isLastRound && nextIndex === 0;

    console.log('Calculated values:', {
      nextIndex,
      isRoundComplete,
      nextRound,
      isLastRound,
      shouldEndGame
    });

    return {
      ...state,
      currentTeamIndex: shouldEndGame ? state.currentTeamIndex : nextIndex,
      currentRound: nextRound,
      isGameOver: shouldEndGame
    };
  }),

  nextRound: () => set(state => ({
    ...state,
    currentRound: state.currentRound + 1,
    currentTeamIndex: 0
  })),

  endGame: () => set(state => ({ ...state, isGameOver: true })),

  addTurnResult: (result) => {
    const state = get();
    console.log('Current game state in addTurnResult:', {
      totalRounds: state.totalRounds,
      currentRound: state.currentRound
    });

    const team = state.teams.find(t => t.id === result.teamId);
    if (team) {
      set(state => ({
        ...state,
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