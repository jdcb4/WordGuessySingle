import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from './use-game-store';
import type { WSMessage, GameState } from '@shared/schema';

export function useWebSocket(gameId?: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const initializeGame = useGameStore(state => state.initializeGame);
  const updateGameState = useGameStore(state => state.updateGameState);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      // Join or create game
      ws.send(JSON.stringify({
        type: 'join_game',
        payload: { gameId }
      }));
    };

    ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'game_state': {
          const gameState = message.payload as GameState;
          updateGameState(gameState);
          break;
        }
        case 'error': {
          console.error('WebSocket error:', message.payload);
          break;
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [gameId]);

  const sendMessage = useCallback((message: WSMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return {
    connected,
    sendMessage
  };
}
