import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CalculatorContextType {
  isOpen: boolean;
  openCalculator: () => void;
  closeCalculator: () => void;
  toggleCalculator: () => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (context === undefined) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
};

interface CalculatorProviderProps {
  children: ReactNode;
}

export const CalculatorProvider: React.FC<CalculatorProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openCalculator = () => setIsOpen(true);
  const closeCalculator = () => setIsOpen(false);
  const toggleCalculator = () => setIsOpen(!isOpen);

  return (
    <CalculatorContext.Provider value={{
      isOpen,
      openCalculator,
      closeCalculator,
      toggleCalculator,
    }}>
      {children}
    </CalculatorContext.Provider>
  );
};