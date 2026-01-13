import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socket';

const SocketContext = createContext<typeof socketService>(socketService);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (user && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }

    return () => {
      // Don't disconnect on unmount immediately to avoid flickering on nav, 
      // but in this setup unmount usually means app closing or logout.
      // socketService.disconnect(); 
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
