import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { nanoid } from 'nanoid';
import type { GameState, WSMessage, StartGameMessage, TurnResult } from "@shared/schema";

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
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
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
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true
  });

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
            const { gameId: requestedGameId, teamName } = message.payload;
            console.log('Join game request for:', requestedGameId);

            // If game exists, join it
            if (gameSessions.has(requestedGameId)) {
              gameId = requestedGameId;
              const session = gameSessions.get(gameId);
              if (session) {
                session.clients.add(ws);
                console.log('Player joined existing game:', gameId);

                // Add the new team to the game state if not host
                if (!session.state.teams.some(t => t.isHost)) {
                  session.state.teams.push({
                    id: session.state.teams.length + 1,
                    name: teamName,
                    score: 0,
                    roundScores: [],
                    isHost: false
                  });
                }

                // Send current game state to new player
                ws.send(JSON.stringify({
                  type: 'game_state',
                  payload: session.state
                }));

                // Notify other players that someone joined
                broadcastToGame(gameId, {
                  type: 'player_joined',
                  payload: { teamName }
                });
              }
            } else {
              // Create new game if it doesn't exist
              gameId = requestedGameId || nanoid();
              console.log('Creating new game:', gameId);

              const newState: GameState = {
                gameId,
                teams: [{
                  id: 1,
                  name: teamName,
                  score: 0,
                  roundScores: [],
                  isHost: true
                }],
                currentRound: 1,
                totalRounds: 3,
                currentTeamIndex: 0,
                excludedCategories: [],
                isGameStarted: false,
                isGameOver: false,
                turnDuration: 30,
                hostId: gameId,
                gameMode: 'online'
              };

              gameSessions.set(gameId, {
                state: newState,
                clients: new Set([ws])
              });

              // Send initial game state to creator
              ws.send(JSON.stringify({
                type: 'game_state',
                payload: newState
              }));
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

          case 'end_turn': {
            if (!gameId || !gameSessions.has(gameId)) {
              console.error('Invalid game ID for end_turn:', gameId);
              return;
            }
            const session = gameSessions.get(gameId);
            if (!session) return;

            console.log('Processing turn end for game:', gameId);

            const { turnResult, nextTeamIndex, currentRound } = message.payload;

            // Update team scores
            session.state.teams = session.state.teams.map(team =>
              team.id === turnResult.teamId
                ? {
                    ...team,
                    score: team.score + turnResult.score,
                    roundScores: [...team.roundScores, turnResult.score]
                  }
                : team
            );

            // Update game state
            session.state.currentTeamIndex = nextTeamIndex;
            session.state.currentRound = currentRound;
            session.state.isGameOver = currentRound > session.state.totalRounds;

            // Broadcast updated state to all clients
            broadcastToGame(gameId, {
              type: 'game_state',
              payload: session.state
            });
            break;
          }

          case 'turn_started': {
            if (!gameId || !gameSessions.has(gameId)) return;

            // Broadcast turn start to all clients
            broadcastToGame(gameId, message);
            break;
          }

          default: {
            console.warn('Unknown message type:', message.type);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Unknown message type' }
            }));
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