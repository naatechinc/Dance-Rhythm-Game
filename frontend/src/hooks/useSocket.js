import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * useSocket
 * Connects to the backend socket server and joins a session room.
 * Returns the socket instance so components can listen/emit directly.
 */
export default function useSocket(sessionId) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('session:join', { sessionId });
    });

    socket.on('disconnect', (reason) => {
      console.warn('[socket] disconnected:', reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  return socketRef.current;
}
