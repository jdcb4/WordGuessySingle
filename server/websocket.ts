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
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
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
    pingTimeout: 20000,
    pingInterval: 25000
  });

  console.log('Socket.IO server initialized');

  io.on('connection', (socket) => {
    console.log('New Socket.IO connection established:', socket.id);

    let gameCode: string;
    let teamName: string;

    socket.on('create_game', (data) => {
      try {
        gameCode = generateGameCode();
        const session: GameSession = {
          code: gameCode,
          host: socket.id,
          clients: new Map(),
          state: data.state
        };
        gameSessions.set(gameCode, session);
        socket.join(gameCode); // Host joins the game room
        socket.emit('game_created', { code: gameCode });
        console.log('Game created with code:', gameCode);
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', { message: 'Failed to create game' });
      }
    });

    socket.on('join_game', (data) => {
      try {
        const session = gameSessions.get(data.code);
        if (!session) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        teamName = data.teamName;
        if (session.clients.size >= 3) { // Max 4 teams including host
          socket.emit('error', { message: 'Game is full' });
          return;
        }

        // Remove any existing socket with the same team name
        const existingSocketId = session.clients.get(teamName);
        if (existingSocketId) {
          io.to(existingSocketId).emit('kicked', { reason: 'duplicate_team' });
          session.clients.delete(teamName);
        }

        session.clients.set(teamName, socket.id);
        socket.join(gameCode); // Client joins the game room
        console.log('Player joined game:', data.code, 'as team:', teamName);

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

        io.to(session.host).emit('teams_updated', { teams });
        socket.emit('joined_game');
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    socket.on('kick_team', (data) => {
      try {
        const session = gameSessions.get(gameCode);
        if (session?.host === socket.id) {
          const clientId = session.clients.get(data.teamName);
          if (clientId) {
            io.to(clientId).emit('kicked');
            session.clients.delete(data.teamName);
            socket.leave(gameCode);
            console.log('Team kicked:', data.teamName);

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

            io.to(session.host).emit('teams_updated', { teams });
          }
        }
      } catch (error) {
        console.error('Error kicking team:', error);
        socket.emit('error', { message: 'Failed to kick team' });
      }
    });

    socket.on('start_game', () => {
      try {
        const session = gameSessions.get(gameCode);
        if (session?.host === socket.id) {
          console.log('Starting game:', gameCode);
          io.to(gameCode).emit('game_started', { state: session.state });
        }
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO connection closed:', socket.id);
      if (gameCode) {
        const session = gameSessions.get(gameCode);
        if (session) {
          if (session.host === socket.id) {
            // Host disconnected, end game
            io.to(gameCode).emit('game_ended', { reason: 'host_disconnected' });
            gameSessions.delete(gameCode);
            console.log('Game ended due to host disconnection:', gameCode);
          } else if (teamName) {
            // Client disconnected
            session.clients.delete(teamName);
            socket.leave(gameCode);
            console.log('Team disconnected:', teamName);

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

            io.to(session.host).emit('teams_updated', { teams });
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'An unexpected error occurred' });
    });
  });

  return io;
}