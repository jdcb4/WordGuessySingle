import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from './use-game-store';
import type { WSMessage, GameState } from '@shared/schema';

export function useWebSocket(gameId?: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const updateGameState = useGameStore(state => state.updateGameState);

  useEffect(() => {
    // Clean up any existing socket
    if (socket) {
      socket.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        // Join or create game
        ws.send(JSON.stringify({
          type: 'join_game',
          payload: { gameId }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('Received message:', message.type);

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
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnected(false);
    }
  }, [gameId]);

  const sendMessage = useCallback((message: WSMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [socket]);

  return {
    connected,
    sendMessage
  };
}