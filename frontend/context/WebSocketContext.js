'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from '@/context/UserContext';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const { user } = useContext(UserContext);
  const [wsMessages, setWsMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID, skipping WebSocket connection');
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Test
    // const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    // if (!token) {
    //   console.error('No token found, cannot establish WebSocket');
    //   return;
    // }

    console.log('Establishing WebSocket connection for user:', user.id);
    const ws = new WebSocket('ws://localhost:3000/ws/sensor/data');
    // const ws = new WebSocket(`ws://localhost:3000/ws/sensor/data?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = async (event) => {
      if (event.data === 'ping') {
        console.debug('Received ping from server');
        return; // Skip parsing for ping messages
      }

      try {
        let messageText;
        if (event.data instanceof Blob) {
          // Convert Blob to text
          messageText = await event.data.text();
        } else {
          messageText = event.data; // Assume it's a string
        }

        // Only parse if the message looks like JSON (starts with '{' or '[')
        if (messageText.trim().startsWith('{') || messageText.trim().startsWith('[')) {
          const message = JSON.parse(messageText);
          setWsMessages((prev) => [...prev, message]);
          console.log('Parsed WebSocket message:', message);
        } else {
          console.debug('Received non-JSON message:', messageText);
          // Optionally handle non-JSON messages differently if needed
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      wsRef.current = null;
    };

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket connection on cleanup');
        wsRef.current.close();
      }
    };
  }, [user?.id]);

  return (
    <WebSocketContext.Provider value={{ wsMessages }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);