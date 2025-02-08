import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { GameState } from '@shared/schema';

interface GameSession {
  code: string;
  host: string;
  clients: Map<string, string>;
  state: GameState;
}

const gameSessions = new Map<string, GameSession>();

function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupWebSocket(server: HTTPServer) {
  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('New Socket.IO connection:', socket.id);

    let currentGameCode: string | null = null;
    let currentTeamName: string | null = null;

    socket.on('create_game', async (data) => {
      try {
        const gameCode = generateGameCode();
        currentGameCode = gameCode;

        const session: GameSession = {
          code: gameCode,
          host: socket.id,
          clients: new Map(),
          state: data.state
        };

        gameSessions.set(gameCode, session);
        await socket.join(gameCode);

        console.log(`Game created: ${gameCode}`);
        socket.emit('game_created', { code: gameCode });

      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', { 
          message: 'Failed to create game'
        });
      }
    });

    socket.on('join_game', async (data) => {
      try {
        const { code, teamName } = data;
        const session = gameSessions.get(code);

        if (!session) {
          throw new Error('Game not found');
        }

        if (session.clients.size >= 3) {
          throw new Error('Game is full');
        }

        currentGameCode = code;
        currentTeamName = teamName;

        await socket.join(code);
        session.clients.set(teamName, socket.id);

        const teams = [
          { id: 1, name: session.state.teams[0].name, score: 0, roundScores: [] },
          ...Array.from(session.clients.keys()).map((name, i) => ({
            id: i + 2,
            name,
            score: 0,
            roundScores: []
          }))
        ];

        io.to(session.host).emit('teams_updated', { teams });
        socket.emit('joined_game');

      } catch (error) {
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to join game'
        });
      }
    });

    socket.on('disconnect', () => {
      if (currentGameCode) {
        const session = gameSessions.get(currentGameCode);
        if (session) {
          if (session.host === socket.id) {
            io.to(currentGameCode).emit('game_ended', { reason: 'host_disconnected' });
            gameSessions.delete(currentGameCode);
          } else if (currentTeamName) {
            session.clients.delete(currentTeamName);
            const teams = [
              { id: 1, name: session.state.teams[0].name, score: 0, roundScores: [] },
              ...Array.from(session.clients.keys()).map((name, i) => ({
                id: i + 2,
                name,
                score: 0,
                roundScores: []
              }))
            ];
            io.to(session.host).emit('teams_updated', { teams });
          }
        }
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'An unexpected error occurred' });
    });
  });

  return io;
}