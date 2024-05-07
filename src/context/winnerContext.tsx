import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WinnerContextType {
  winner: string;
  setWinner: (winner: string) => void;
}

const WinnerContext = createContext<WinnerContextType | undefined>(undefined);

export const WinnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [winner, setWinner] = useState<string>('');

  return (
    <WinnerContext.Provider value={{ winner, setWinner }}>
      {children}
    </WinnerContext.Provider>
  );
};

export const useWinner = (): WinnerContextType => {
  const context = useContext(WinnerContext);
  if (!context) {
    throw new Error('useWinner must be used within a WinnerProvider');
  }
  return context;
};