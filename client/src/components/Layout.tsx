import React, { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;
const collapsedDrawerWidth = 60;

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Visão Geral', icon: <DashboardIcon />, path: '/' },
  { text: 'Controle Mensal', icon: <ListAltIcon />, path: '/monthly-control' },
  { text: 'Fluxo de Caixa', icon: <AccountBalanceWalletIcon />, path: '/cash-flow' },
  { text: 'Cartão de Crédito', icon: <CreditCardIcon />, path: '/credit-card' },
  { text: 'Cadastros', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const currentDrawerWidth = sidebarCollapsed ? collapsedDrawerWidth : drawerWidth;

  // Função para obter o título da página atual
  const getPageTitle = () => {
    const currentPage = menuItems.find(item => item.path === location.pathname);
    return currentPage ? currentPage.text : 'TrackOne Finance';
  };

  const drawer = (
    <Box sx={{ 
      height: '100%',
      bgcolor: '#4586C8',
      color: 'white',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        alignItems: 'center',
        bgcolor: '#4586C8',
        minHeight: '64px',
        px: 2
      }}>
        {!sidebarCollapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
            TrackOne
          </Typography>
        )}
        <IconButton 
          onClick={handleSidebarToggle}
          sx={{ 
            color: 'white',
            display: { xs: 'none', sm: 'block' }
          }}
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <List sx={{ pt: 0 }}>
        {menuItems.map((item) => (
          <ListItem
            component="div"
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              color: 'white',
              minHeight: 48,
              justifyContent: sidebarCollapsed ? 'center' : 'initial',
              px: sidebarCollapsed ? 1 : 2.5,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarCollapsed ? 'auto' : 3,
                justifyContent: 'center',
                color: 'white',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!sidebarCollapsed && (
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: 1,
                  '& .MuiListItemText-primary': {
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }
                }}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#EBF5FE', minHeight: '100vh' }}>
      <CssBaseline />
      {/* AppBar removido conforme solicitado */}
      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#4586C8',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              bgcolor: '#4586C8',
              transition: 'width 0.3s',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          bgcolor: '#EBF5FE',
          minHeight: '100vh',
          transition: 'width 0.3s',
        }}
      >
        {/* Mobile menu button */}
        <Box sx={{ 
          display: { xs: 'block', sm: 'none' },
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
          bgcolor: 'white',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ 
              color: '#4586C8',
              p: 1.5
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        
        {/* Toolbar removido junto com o AppBar */}
        {children}
      </Box>
    </Box>
  );
}
