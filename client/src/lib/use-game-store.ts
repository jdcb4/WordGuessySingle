import { create } from 'zustand';
import { GameState, Team, TurnResult } from '@shared/schema';
import { nanoid } from 'nanoid';

interface GameStore extends GameState {
  initializeGame: (teams: Team[], excludedCategories: string[], turnDuration: number, totalRounds: number, gameMode: 'local' | 'online', gameId?: string) => void;
  updateTeamScore: (teamId: number, points: number) => void;
  nextTeam: () => void;
  nextRound: () => void;
  endGame: () => void;
  addTurnResult: (result: TurnResult) => void;
  reset: () => void;
  updateGameState: (state: GameState) => void;
  isHost: () => boolean;
}

const initialState: GameState = {
  gameId: '',
  teams: [],
  currentRound: 1,
  totalRounds: 3,
  currentTeamIndex: 0,
  excludedCategories: [],
  isGameStarted: false,
  isGameOver: false,
  turnDuration: 30,
  hostId: undefined,
  gameMode: 'local'
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initializeGame: (teams, excludedCategories, turnDuration, totalRounds, gameMode = 'local', gameId = '') => {
    // For online mode, use provided gameId or generate a new one
    const finalGameId = gameMode === 'online' ? gameId : '';

    set({
      gameId: finalGameId,
      teams,
      excludedCategories,
      turnDuration,
      totalRounds,
      isGameStarted: true,
      currentRound: 1,
      currentTeamIndex: 0,
      gameMode,
      isGameOver: false,
      hostId: gameMode === 'online' ? finalGameId : undefined
    });
  },

  updateGameState: (state) => {
    // Preserve local state that shouldn't be overwritten
    const currentState = get();
    set({
      ...state,
      hostId: currentState.hostId // Preserve host ID
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

  isHost: () => {
    const state = get();
    return state.gameMode === 'local' || state.hostId === state.gameId;
  },

  reset: () => set(initialState)
}));