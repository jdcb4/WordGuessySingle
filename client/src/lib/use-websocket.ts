import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from './use-game-store';
import type { WSMessage, GameState } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useWebSocket(gameId?: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const updateGameState = useGameStore(state => state.updateGameState);
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (!gameId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setConnected(true);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('Received WebSocket message:', message.type);

          switch (message.type) {
            case 'game_state': {
              const gameState = message.payload as GameState;
              console.log('Updating game state:', gameState);
              updateGameState(gameState);
              break;
            }
            case 'player_joined': {
              toast({
                title: "Player joined",
                description: `${message.payload.teamName} has joined the game.`,
              });
              break;
            }
            case 'player_left': {
              toast({
                title: "Player left",
                description: "A player has left the game.",
              });
              break;
            }
            case 'error': {
              console.error('WebSocket error:', message.payload);
              toast({
                title: "Error",
                description: message.payload.message,
                variant: "destructive",
              });
              break;
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        setSocket(null);

        if (!event.wasClean && reconnectAttempts < 3) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 5000);
          console.log(`Attempting reconnect in ${timeout}ms`);

          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, timeout);

          toast({
            title: "Connection Lost",
            description: "Attempting to reconnect...",
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to game server",
          variant: "destructive",
        });
      };

      setSocket(ws);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnected(false);
      setSocket(null);
    }
  }, [gameId, reconnectAttempts, updateGameState, toast]);

  useEffect(() => {
    if (gameId) {
      connect();
    } else {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close(1000, "Clean disconnect");
      }
      setSocket(null);
      setConnected(false);
    }

    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close(1000, "Clean disconnect");
      }
    };
  }, [gameId, socket, connect]);

  const sendMessage = useCallback((message: WSMessage) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    try {
      console.log('Sending WebSocket message:', message.type);
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [socket, toast]);

  return {
    connected,
    sendMessage
  };
}