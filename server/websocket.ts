import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { GameState } from '@shared/schema';

// Store active game sessions
interface GameSession {
  code: string;
  host: string; // socket id
  clients: Map<string, string>; // teamName -> socket id
  state: GameState;
}

const gameSessions = new Map<string, GameSession>();

// Generate a unique 6-character game code
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
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    connectTimeout: 45000
  });

  console.log('Socket.IO server initialized');

  io.engine.on("connection_error", (err) => {
    console.log('Socket.IO connection error:', err.req?.url, err.code, err.message, err.context);
  });

  io.engine.on("headers", (headers, req) => {
    console.log('Socket.IO handshake headers:', headers);
  });

  io.on('connection', (socket) => {
    console.log('New Socket.IO connection established:', socket.id, 'Transport:', socket.conn.transport.name);

    socket.conn.on("upgrade", (transport) => {
      console.log('Socket transport upgraded:', transport.name);
    });

    // Track the game code and team name for this socket
    let currentGameCode: string | null = null;
    let currentTeamName: string | null = null;

    socket.on('create_game', async (data) => {
      try {
        console.log('Creating game, socket state:', socket.connected, 'Transport:', socket.conn.transport.name);
        // Generate unique game code
        const gameCode = generateGameCode();
        currentGameCode = gameCode;

        // Create new game session
        const session: GameSession = {
          code: gameCode,
          host: socket.id,
          clients: new Map(),
          state: data.state
        };

        // Store session and join room
        gameSessions.set(gameCode, session);
        await socket.join(gameCode);

        console.log(`Game created: ${gameCode} by host: ${socket.id}`);
        socket.emit('game_created', { code: gameCode });

      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', { 
          message: 'Failed to create game',
          details: error instanceof Error ? error.message : 'Unknown error'
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

        // Update tracking variables
        currentGameCode = code;
        currentTeamName = teamName;

        // Join room and update session
        await socket.join(code);
        session.clients.set(teamName, socket.id);

        console.log(`Player joined: ${teamName} in game: ${code}`);

        // Update team list
        const teams = [
          { id: 1, name: session.state.teams[0].name, score: 0, roundScores: [] },
          ...Array.from(session.clients.keys()).map((name, i) => ({
            id: i + 2,
            name,
            score: 0,
            roundScores: []
          }))
        ];

        // Notify host and joining player
        io.to(session.host).emit('teams_updated', { teams });
        socket.emit('joined_game');

      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to join game'
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', socket.id, 'Reason:', reason, 'Last transport:', socket.conn.transport?.name);

      if (currentGameCode) {
        const session = gameSessions.get(currentGameCode);
        if (session) {
          if (session.host === socket.id) {
            // Host disconnected
            console.log(`Host disconnected, ending game: ${currentGameCode}`);
            io.to(currentGameCode).emit('game_ended', { reason: 'host_disconnected' });
            gameSessions.delete(currentGameCode);
          } else if (currentTeamName) {
            // Player disconnected
            console.log(`Player disconnected: ${currentTeamName} from game: ${currentGameCode}`);
            session.clients.delete(currentTeamName);

            // Update remaining players
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

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error for', socket.id, ':', error);
      socket.emit('error', { message: 'An unexpected error occurred' });
    });
  });

  return io;
}