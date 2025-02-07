import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { nanoid } from 'nanoid';
import type { GameState, WSMessage, StartGameMessage } from "@shared/schema";

// Store active game sessions
const gameSessions = new Map<string, {
  state: GameState;
  clients: Set<WebSocket>;
}>();

function broadcastToGame(gameId: string, message: WSMessage) {
  const session = gameSessions.get(gameId);
  if (!session) {
    console.log('No session found for game:', gameId);
    return;
  }

  const messageStr = JSON.stringify(message);
  console.log(`Broadcasting ${message.type} to ${session.clients.size} clients in game:`, gameId);

  session.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Heartbeat to keep connections alive
function heartbeat(ws: WebSocket) {
  console.log('Received pong from client');
  (ws as any).isAlive = true;
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Set up heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        console.log('Terminating inactive client');
        return ws.terminate();
      }

      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    let gameId = '';

    // Set up ping-pong
    (ws as any).isAlive = true;
    ws.on('pong', () => heartbeat(ws));

    ws.on('message', (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        console.log('Received message:', message.type, 'for game:', gameId);

        switch (message.type) {
          case 'join_game': {
            const { gameId: requestedGameId } = message.payload;
            console.log('Join game request for:', requestedGameId);

            // If game exists, join it
            if (gameSessions.has(requestedGameId)) {
              gameId = requestedGameId;
              const session = gameSessions.get(gameId);
              if (session) {
                session.clients.add(ws);
                console.log('Player joined existing game:', gameId);

                // Send current game state to new player
                ws.send(JSON.stringify({
                  type: 'game_state',
                  payload: session.state
                }));

                // Notify other players that someone joined
                broadcastToGame(gameId, {
                  type: 'player_joined',
                  payload: { gameId }
                });
              }
            } else {
              // Create new game if it doesn't exist
              gameId = requestedGameId || nanoid();
              console.log('Creating new game:', gameId);

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
                  hostId: gameId
                },
                clients: new Set([ws])
              });

              // Send initial game state to creator
              const newSession = gameSessions.get(gameId);
              if (newSession) {
                ws.send(JSON.stringify({
                  type: 'game_state',
                  payload: newSession.state
                }));
              }
            }
            break;
          }

          case 'start_game': {
            if (!gameId || !gameSessions.has(gameId)) {
              console.error('Invalid game ID for start_game:', gameId);
              return;
            }
            const session = gameSessions.get(gameId);
            if (!session) return;

            console.log('Starting game:', gameId);

            // Update game state
            const startMessage = message as StartGameMessage;
            session.state = {
              ...session.state,
              ...startMessage.payload,
              isGameStarted: true
            };

            // Broadcast updated state to all clients
            broadcastToGame(gameId, {
              type: 'game_state',
              payload: session.state
            });
            break;
          }

          case 'end_turn':
          case 'next_round': {
            if (!gameId || !gameSessions.has(gameId)) {
              console.error('Invalid game ID for', message.type, ':', gameId);
              return;
            }
            const session = gameSessions.get(gameId);
            if (!session) return;

            console.log(`Processing ${message.type} for game:`, gameId);

            // Update game state
            session.state = {
              ...session.state,
              ...message.payload
            };

            // Broadcast updated state to all clients
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
        const session = gameSessions.get(gameId);
        if (session) {
          session.clients.delete(ws);
          console.log('Player disconnected from game:', gameId);

          // Notify other players about disconnection
          broadcastToGame(gameId, {
            type: 'player_left',
            payload: { gameId }
          });

          // Clean up empty game sessions
          if (session.clients.size === 0) {
            console.log('Cleaning up empty game:', gameId);
            gameSessions.delete(gameId);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}