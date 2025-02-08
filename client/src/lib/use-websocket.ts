import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
      toast({
        title: "Connected",
        description: "Successfully connected to the game server",
      });
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        const handlers = handlersRef.current.get(message.type) || [];
        handlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
        toast({
          title: "Error",
          description: "Failed to process server message",
          variant: "destructive",
        });
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to game server",
        variant: "destructive",
      });
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      toast({
        title: "Disconnected",
        description: "Connection to game server lost",
        variant: "destructive",
      });
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket connection');
        socket.close();
      }
    };
  }, [toast]);

  const send = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      console.log('Sending WebSocket message:', data);
      socketRef.current.send(message);
    } else {
      console.error('WebSocket is not connected');
      toast({
        title: "Connection Error",
        description: "Not connected to game server",
        variant: "destructive",
      });
    }
  }, [toast]);

  const on = useCallback((type: string, handler: MessageHandler) => {
    const handlers = handlersRef.current.get(type) || [];
    handlers.push(handler);
    handlersRef.current.set(type, handlers);
    console.log(`Registered handler for message type: ${type}`);

    return () => {
      const handlers = handlersRef.current.get(type) || [];
      handlersRef.current.set(type, handlers.filter(h => h !== handler));
      console.log(`Unregistered handler for message type: ${type}`);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        console.log('Cleaning up WebSocket connection');
        socketRef.current.close();
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