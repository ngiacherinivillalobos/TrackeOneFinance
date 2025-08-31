import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
}: PageLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  // Gerar breadcrumbs automaticamente se não forem fornecidos
  const autoBreadcrumbs = breadcrumbs || [
    { label: 'Dashboard', path: '/dashboard' },
    { label: title }
  ];

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        {autoBreadcrumbs.map((breadcrumb, index) =>
          breadcrumb.path ? (
            <Link
              key={index}
              component={RouterLink}
              to={breadcrumb.path}
              underline="hover"
              color="inherit"
            >
              {breadcrumb.label}
            </Link>
          ) : (
            <Typography key={index} color="text.primary">
              {breadcrumb.label}
            </Typography>
          )
        )}
      </Breadcrumbs>

      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          textAlign: isMobile ? 'center' : 'left'
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto'
          }}>
            {actions}
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: isMobile ? 2 : 3,
        boxShadow: 1
      }}>
        {children}
      </Box>
    </Box>
  );
}