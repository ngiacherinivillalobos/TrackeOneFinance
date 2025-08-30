import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import { colors } from '../../theme/modernTheme';

interface StatsSectionProps {
  totalReceitas: number;
  totalDespesas: number;
  totalVencidos: number;
  totalVencemHoje: number;
  totalAVencer: number;
  saldoPeriodo: number;
  formatCurrency: (value: number) => string;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  totalReceitas,
  totalDespesas,
  totalVencidos,
  totalVencemHoje,
  totalAVencer,
  saldoPeriodo,
  formatCurrency
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const stats = [
    {
      title: 'Receitas',
      value: totalReceitas,
      icon: <IncomeIcon sx={{ color: colors.success[600] }} />,
      color: colors.success[600],
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Despesas',
      value: totalDespesas,
      icon: <ExpenseIcon sx={{ color: colors.error[600] }} />,
      color: colors.error[600],
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Saldo',
      value: saldoPeriodo,
      icon: <BalanceIcon sx={{ color: saldoPeriodo >= 0 ? colors.success[600] : colors.error[600] }} />,
      color: saldoPeriodo >= 0 ? colors.success[600] : colors.error[600],
      bgColor: saldoPeriodo >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Vencidos',
      value: totalVencidos,
      color: colors.error[600],
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Vencem Hoje',
      value: totalVencemHoje,
      color: colors.warning[600],
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'A Vencer',
      value: totalAVencer,
      color: colors.success[600],
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  if (isSmallScreen) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {stats.slice(0, 3).map((stat, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: stat.bgColor || 'rgba(103, 126, 234, 0.1)',
                border: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {stat.icon && (
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1,
                    bgcolor: 'white',
                  }}>
                    {stat.icon}
                  </Box>
                )}
                <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                  {stat.title}
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: stat.color
                }}
              >
                {formatCurrency(stat.value)}
              </Typography>
            </Paper>
          ))}
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
          {stats.slice(3).map((stat, index) => (
            <Paper
              key={index + 3}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: stat.bgColor || 'rgba(103, 126, 234, 0.1)',
                border: '1px solid #e0e0e0',
                textAlign: 'center',
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  color: stat.color,
                  mb: 0.5
                }}
              >
                {formatCurrency(stat.value)}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.gray[600] }}>
                {stat.title}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, mb: 3 }}>
      {stats.map((stat, index) => (
        <Paper
          key={index}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: stat.bgColor || 'rgba(103, 126, 234, 0.1)',
            border: '1px solid #e0e0e0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {stat.icon && (
              <Box sx={{ 
                p: 1, 
                borderRadius: 1,
                bgcolor: 'white',
              }}>
                {stat.icon}
              </Box>
            )}
            <Typography variant="body2" sx={{ color: colors.gray[600] }}>
              {stat.title}
            </Typography>
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: stat.color
            }}
          >
            {formatCurrency(stat.value)}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};