import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { colors } from '../theme/modernTheme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  loading = false,
  trend,
}: StatCardProps) {
  const theme = useTheme();
  const colorScheme = colors[color];

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        }
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 2
        }}>
          {icon && (
            <Box 
              sx={{ 
                p: 1,
                borderRadius: 1,
                bgcolor: `${colorScheme[100]}20`,
                color: colorScheme[600],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {icon}
            </Box>
          )}
          
          {loading && <CircularProgress size={20} />}
        </Box>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            mb: 1,
            fontSize: '1.1rem'
          }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontWeight: 700,
            color: colorScheme[600],
            mb: 2,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {value}
        </Typography>
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              component="span" 
              sx={{ 
                color: trend.isPositive ? colors.success[600] : colors.error[600],
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Box>
            <Typography variant="body2" color="text.secondary">
              em relação ao mês anterior
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}