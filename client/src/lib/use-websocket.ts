import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket.IO already connected');
      return;
    }

    // Initialize socket with robust configuration
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 60000,
      autoConnect: false
    });

    socketRef.current = socket;
    console.log('Initializing Socket.IO connection...');

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id);
      toast({
        title: "Connected",
        description: "Successfully connected to the game server",
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      toast({
        title: "Connection Error",
        description: `Failed to connect: ${error.message}`,
        variant: "destructive",
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);

      if (reason === 'io server disconnect') {
        // Reconnect if the server initiated the disconnect
        socket.connect();
      }

      toast({
        title: "Disconnected",
        description: `Connection lost: ${reason}`,
        variant: "destructive",
      });
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    });

    // Register existing message handlers
    handlersRef.current.forEach((handlers, type) => {
      socket.on(type, (data) => {
        console.log(`Received ${type}:`, data);
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in ${type} handler:`, error);
          }
        });
      });
    });

    // Start connection
    socket.connect();

    return () => {
      if (socket.connected) {
        console.log('Cleaning up Socket.IO connection');
        socket.disconnect();
      }
    };
  }, [toast]);

  const send = useCallback((data: { type: string; [key: string]: any }) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.error('Socket.IO is not connected');
      toast({
        title: "Connection Error",
        description: "Not connected to game server",
        variant: "destructive",
      });
      return;
    }

    const { type, ...payload } = data;
    console.log(`Sending ${type}:`, payload);

    try {
      socket.emit(type, payload);
    } catch (error) {
      console.error(`Error sending ${type}:`, error);
      toast({
        title: "Error",
        description: "Failed to send message to server",
        variant: "destructive",
      });
    }
  }, [toast]);

  const on = useCallback((type: string, handler: MessageHandler) => {
    const handlers = handlersRef.current.get(type) || [];
    handlers.push(handler);
    handlersRef.current.set(type, handlers);
    console.log(`Registered handler for: ${type}`);

    const socket = socketRef.current;
    if (socket) {
      socket.on(type, (data) => {
        console.log(`Received ${type}:`, data);
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${type} handler:`, error);
        }
      });
    }

    return () => {
      const handlers = handlersRef.current.get(type) || [];
      handlersRef.current.set(type, handlers.filter(h => h !== handler));
      console.log(`Unregistered handler for: ${type}`);

      if (socketRef.current) {
        socketRef.current.off(type);
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      const socket = socketRef.current;
      if (socket?.connected) {
        console.log('Cleaning up Socket.IO connection');
        socket.disconnect();
      }
    };
  }, [connect]);

  return {
    connect,
    send,
    on,
    socket: socketRef.current
  };
}