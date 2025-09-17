import React from 'react';
import {
  Fab,
  Tooltip,
  Zoom,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { useCalculator } from '../contexts/CalculatorContext';

const FloatingCalculatorButton: React.FC = () => {
  const { isOpen, toggleCalculator } = useCalculator();

  return (
    <Zoom in={true}>
      <Tooltip title="Calculadora (F2)" placement="left" arrow>
        <Fab
          color="primary"
          onClick={toggleCalculator}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: isOpen 
              ? 'linear-gradient(45deg, #1e3658 30%, #2d4a73 90%)' 
              : 'linear-gradient(45deg, #2A4B75 30%, #3A5F92 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1e3658 30%, #2d4a73 90%)',
              transform: 'scale(1.05)',
            },
            transition: 'transform 0.2s, background 0.3s',
            boxShadow: isOpen 
              ? '0 6px 20px rgba(42, 75, 117, 0.6)' 
              : '0 4px 20px rgba(42, 75, 117, 0.4)',
            border: isOpen ? '2px solid #ffffff' : 'none',
          }}
        >
          <CalculateIcon />
        </Fab>
      </Tooltip>
    </Zoom>
  );
};

export default FloatingCalculatorButton;