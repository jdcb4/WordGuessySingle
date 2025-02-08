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

    // Initialize socket with auto-reconnection
    const socket = io({
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;
    console.log('Connecting to Socket.IO server...');

    socket.on('connect', () => {
      console.log('Socket.IO connection established');
      toast({
        title: "Connected",
        description: "Successfully connected to the game server",
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to game server",
        variant: "destructive",
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      toast({
        title: "Disconnected",
        description: "Connection to game server lost",
        variant: "destructive",
      });
    });

    // Handle custom messages
    const messageHandler = (event: any) => {
      try {
        console.log('Received Socket.IO message:', event);
        const handlers = handlersRef.current.get(event.type) || [];
        handlers.forEach(handler => handler(event));
      } catch (error) {
        console.error('Socket.IO message handling error:', error);
        toast({
          title: "Error",
          description: "Failed to process server message",
          variant: "destructive",
        });
      }
    };

    // Register event handlers for all existing message types
    handlersRef.current.forEach((_, type) => {
      socket.on(type, messageHandler);
    });

    return () => {
      if (socket.connected) {
        console.log('Cleaning up Socket.IO connection');
        socket.disconnect();
      }
    };
  }, [toast]);

  const send = useCallback((data: { type: string; [key: string]: any }) => {
    if (!socketRef.current?.connected) {
      console.error('Socket.IO is not connected');
      toast({
        title: "Connection Error",
        description: "Not connected to game server",
        variant: "destructive",
      });
      return;
    }

    const { type, ...payload } = data;
    console.log('Sending Socket.IO message:', data);
    socketRef.current.emit(type, payload);
  }, [toast]);

  const on = useCallback((type: string, handler: MessageHandler) => {
    const handlers = handlersRef.current.get(type) || [];
    handlers.push(handler);
    handlersRef.current.set(type, handlers);
    console.log(`Registered handler for message type: ${type}`);

    // If socket exists, register the handler immediately
    if (socketRef.current) {
      socketRef.current.on(type, handler);
    }

    return () => {
      const handlers = handlersRef.current.get(type) || [];
      handlersRef.current.set(type, handlers.filter(h => h !== handler));
      console.log(`Unregistered handler for message type: ${type}`);

      // Remove handler from socket if it exists
      if (socketRef.current) {
        socketRef.current.off(type, handler);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current?.connected) {
        console.log('Cleaning up Socket.IO connection');
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    connect,
    send,
    on,
    socket: socketRef.current
  };
}