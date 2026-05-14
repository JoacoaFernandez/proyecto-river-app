import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  user: ChatUser;
}

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useLiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('chat:join');
    });

    newSocket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    newSocket.on('chat:new_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('chat:error', ({ message }: { message: string }) => {
      setChatError(message);
      setTimeout(() => setChatError(null), 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendMessage = (message: string) => {
    const token = localStorage.getItem('river_app_token');
    if (!token || !socket) return;
    socket.emit('chat:send', { message, token });
  };

  return { messages, sendMessage, chatError };
}
