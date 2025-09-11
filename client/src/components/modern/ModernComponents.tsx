import React from 'react';
import { Paper, Typography, Box, PaperProps } from '@mui/material';
import { colors, gradients, shadows } from '../../theme/modernTheme';

interface ModernCardProps extends PaperProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: keyof typeof gradients;
  children: React.ReactNode;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  title,
  subtitle,
  icon,
  gradient = 'card',
  children,
  sx,
  ...props
}) => {
  return (
    <Paper
      {...props}
      sx={{
        p: 3,
        borderRadius: 1.5,
        background: gradients[gradient],
        border: '1px solid #e2e8f0',
        boxShadow: shadows.md,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: shadows.lg,
          transform: 'translateY(-2px)',
        },
        ...sx,
      }}
    >
      {(title || subtitle || icon) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'rgba(103, 126, 234, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primary[600],
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            {title && (
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[900] }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      {children}
    </Paper>
  );
};

interface ModernSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerGradient?: boolean;
}

export const ModernSection: React.FC<ModernSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  headerGradient = false,
}) => {
  return (
    <Paper
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: shadows.md,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: headerGradient ? gradients.primary : colors.gray[50],
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: headerGradient ? 'rgba(255,255,255,0.2)' : 'rgba(103, 126, 234, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: headerGradient ? 'white' : colors.primary[600],
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: headerGradient ? 'white' : colors.gray[900],
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: headerGradient ? 'rgba(255,255,255,0.8)' : colors.gray[600],
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Content */}
      <Box sx={{ p: 3, bgcolor: 'white' }}>
        {children}
      </Box>
    </Paper>
  );
};

interface ModernStatsCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgColor?: string;
}

export const ModernStatsCard: React.FC<ModernStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  iconBgColor,
}) => {
  // Garantir que sempre temos um colorScheme válido
  const colorScheme = colors[color] || colors.primary;
  
  return (
    <Paper
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: '#FFFFFF',
        border: '1px solid #e2e8f0',
        boxShadow: shadows.md,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: shadows.lg,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ color: colors.gray[600], mb: 0.5, fontSize: '0.7rem' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.gray[900], mb: 0.25, fontSize: '1.1rem', lineHeight: 1.2 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: colors.gray[500], fontSize: '0.65rem' }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  color: trend.isPositive ? colors.success[600] : colors.error[600],
                  fontWeight: 600,
                  fontSize: '0.65rem'
                }}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            bgcolor: iconBgColor || `${colorScheme[50]}`,
            color: colorScheme[600],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
};

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && (
        <Box sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, index) => (
            <Typography
              key={index}
              variant="body2"
              component="span"
              sx={{
                color: index === breadcrumbs.length - 1 ? colors.primary[600] : colors.gray[500],
                fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
              }}
            >
              {crumb.label}
              {index < breadcrumbs.length - 1 && (
                <Typography component="span" sx={{ mx: 1, color: colors.gray[400] }}>
                  /
                </Typography>
              )}
            </Typography>
          ))}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: colors.gray[900], mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ color: colors.gray[600] }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default {
  ModernCard,
  ModernSection,
  ModernStatsCard,
  ModernHeader,
};