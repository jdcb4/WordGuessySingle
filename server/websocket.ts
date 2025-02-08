import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { GameState } from '@shared/schema';

// Store active game sessions
interface GameSession {
  code: string;
  host: WebSocket;
  clients: Map<string, WebSocket>; // teamName -> socket
  state: GameState;
}

const gameSessions = new Map<string, GameSession>();

// Generate a unique 6-character game code
function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true
  });

  console.log('WebSocket server initialized');

  wss.on('connection', (socket: WebSocket) => {
    console.log('New WebSocket connection established');

    let gameCode: string;
    let teamName: string;

    socket.on('message', (rawData) => {
      try {
        const message = JSON.parse(rawData.toString());
        console.log('Received message:', message);

        switch (message.type) {
          case 'create_game': {
            gameCode = generateGameCode();
            const session: GameSession = {
              code: gameCode,
              host: socket,
              clients: new Map(),
              state: message.state
            };
            gameSessions.set(gameCode, session);
            socket.send(JSON.stringify({ type: 'game_created', code: gameCode }));
            console.log('Game created with code:', gameCode);
            break;
          }

          case 'join_game': {
            const session = gameSessions.get(message.code);
            if (!session) {
              socket.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
              return;
            }

            teamName = message.teamName;
            if (session.clients.size >= 3) { // Max 4 teams including host
              socket.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
              return;
            }

            session.clients.set(teamName, socket);
            console.log('Player joined game:', message.code, 'as team:', teamName);

            // Notify host of new team
            const teams = [
              { id: 1, name: session.state.teams[0].name, score: 0, roundScores: [] },
              ...Array.from(session.clients.keys()).map((name, i) => ({
                id: i + 2,
                name,
                score: 0,
                roundScores: []
              }))
            ];

            session.host.send(JSON.stringify({ 
              type: 'teams_updated',
              teams
            }));

            socket.send(JSON.stringify({ type: 'joined_game' }));
            break;
          }

          case 'kick_team': {
            const session = gameSessions.get(gameCode);
            if (session?.host === socket) {
              const clientSocket = session.clients.get(message.teamName);
              if (clientSocket) {
                clientSocket.send(JSON.stringify({ type: 'kicked' }));
                session.clients.delete(message.teamName);
                console.log('Team kicked:', message.teamName);

                // Update remaining clients
                const teams = [
                  { id: 1, name: session.state.teams[0].name, score: 0, roundScores: [] },
                  ...Array.from(session.clients.keys()).map((name, i) => ({
                    id: i + 2,
                    name,
                    score: 0,
                    roundScores: []
                  }))
                ];

                session.host.send(JSON.stringify({ 
                  type: 'teams_updated',
                  teams
                }));
              }
            }
            break;
          }

          case 'start_game': {
            const session = gameSessions.get(gameCode);
            if (session?.host === socket) {
              console.log('Starting game:', gameCode);
              session.clients.forEach(client => {
                client.send(JSON.stringify({ 
                  type: 'game_started',
                  state: session.state
                }));
              });
            }
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed');
      if (gameCode) {
        const session = gameSessions.get(gameCode);
        if (session) {
          if (session.host === socket) {
            // Host disconnected, end game
            session.clients.forEach(client => {
              client.send(JSON.stringify({ type: 'game_ended', reason: 'host_disconnected' }));
              client.close();
            });
            gameSessions.delete(gameCode);
            console.log('Game ended due to host disconnection:', gameCode);
          } else if (teamName) {
            // Client disconnected
            session.clients.delete(teamName);
            console.log('Team disconnected:', teamName);
            const teams = [
              { id: 1, name: session.state.teams[0].name, score: 0, roundScores: [] },
              ...Array.from(session.clients.keys()).map((name, i) => ({
                id: i + 2,
                name,
                score: 0,
                roundScores: []
              }))
            ];
            session.host.send(JSON.stringify({ 
              type: 'teams_updated',
              teams
            }));
          }
        }
      }
    });
  });
}