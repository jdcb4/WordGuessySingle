import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { nanoid } from 'nanoid';
import type { GameState, WSMessage } from "@shared/schema";

// Store active game sessions
const gameSessions = new Map<string, {
  state: GameState;
  clients: Set<WebSocket>;
}>();

function broadcastToGame(gameId: string, message: WSMessage) {
  const session = gameSessions.get(gameId);
  if (!session) return;

  const messageStr = JSON.stringify(message);
  session.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let gameId: string | null = null;

    ws.on('message', (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'join_game': {
            const { gameId: requestedGameId } = message.payload;

            // If game exists, join it
            if (gameSessions.has(requestedGameId)) {
              gameId = requestedGameId;
              const session = gameSessions.get(gameId)!;
              session.clients.add(ws);

              // Send current game state to new player
              ws.send(JSON.stringify({
                type: 'game_state',
                payload: session.state
              }));
            } else {
              // Create new game if it doesn't exist
              gameId = requestedGameId || nanoid();
              gameSessions.set(gameId, {
                state: {
                  gameId,
                  teams: [],
                  currentRound: 1,
                  totalRounds: 3,
                  currentTeamIndex: 0,
                  excludedCategories: [],
                  isGameStarted: false,
                  isGameOver: false,
                  turnDuration: 30,
                  hostId: gameId // Use gameId as hostId for the creator
                },
                clients: new Set([ws])
              });

              // Send game ID to creator
              ws.send(JSON.stringify({
                type: 'game_state',
                payload: gameSessions.get(gameId)!.state
              }));
            }
            break;
          }

          case 'start_game': {
            if (!gameId || !gameSessions.has(gameId)) return;
            const session = gameSessions.get(gameId)!;

            // Update game state
            session.state = {
              ...session.state,
              ...message.payload,
              isGameStarted: true
            };

            // Broadcast updated state
            broadcastToGame(gameId, {
              type: 'game_state',
              payload: session.state
            });
            break;
          }

          case 'end_turn':
          case 'next_round': {
            if (!gameId || !gameSessions.has(gameId)) return;
            const session = gameSessions.get(gameId)!;

            // Update game state
            session.state = {
              ...session.state,
              ...message.payload
            };

            // Broadcast updated state
            broadcastToGame(gameId, {
              type: 'game_state',
              payload: session.state
            });
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' }
        }));
      }
    });

    ws.on('close', () => {
      if (gameId && gameSessions.has(gameId)) {
        const session = gameSessions.get(gameId)!;
        session.clients.delete(ws);

        // Clean up empty game sessions
        if (session.clients.size === 0) {
          gameSessions.delete(gameId);
        }
      }
    });
  });

  return httpServer;
}