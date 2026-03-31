import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user) {
      socketRef.current = io('http://localhost:5000', { transports: ['websocket'] });
      socketRef.current.emit('setup', user._id);

      socketRef.current.on('user_online',  (id) => setOnlineUsers(prev => [...new Set([...prev, id])]));
      socketRef.current.on('user_offline', (id) => setOnlineUsers(prev => prev.filter(u => u !== id)));

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
