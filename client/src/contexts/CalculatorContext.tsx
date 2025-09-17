import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  // Adicionar listener global para atalho F2
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar se F2 foi pressionado
      if (event.key === 'F2') {
        event.preventDefault();
        toggleCalculator();
      }
      
      // Fechar com Escape quando a calculadora estiver aberta
      if (event.key === 'Escape' && isOpen) {
        closeCalculator();
      }
    };

    // Adicionar listener quando o componente montar
    document.addEventListener('keydown', handleKeyDown);
    
    // Remover listener quando o componente desmontar
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, toggleCalculator, closeCalculator]);

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