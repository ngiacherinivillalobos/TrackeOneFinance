import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderSectionProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  handleOpenNewTransaction: () => void;
  isMediumScreen: boolean;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  currentDate,
  setCurrentDate,
  handleOpenNewTransaction,
  isMediumScreen
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 3,
      flexWrap: 'wrap',
      gap: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4">
          Controle Mensal
        </Typography>
        {!isSmallScreen && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Button 
              onClick={handleCurrentMonth}
              size="small"
              variant="outlined"
            >
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </Button>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenNewTransaction}
      >
        {isMediumScreen ? 'Nova Transação' : 'Nova'}
      </Button>
    </Box>
  );
};