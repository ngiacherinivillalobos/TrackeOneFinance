import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
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
  Divider,
  Collapse,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 220;
const collapsedDrawerWidth = 56;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { text: 'Visão Geral', icon: <DashboardOutlinedIcon />, path: '/dashboard' },
  { text: 'Controle Mensal', icon: <InsightsOutlinedIcon />, path: '/monthly-control' },
  { text: 'Controle Semanal', icon: <CalendarTodayOutlinedIcon />, path: '/weekly-control' },
  { text: 'Fluxo de Caixa', icon: <PaymentsOutlinedIcon />, path: '/cash-flow' },
  { text: 'Cartão de Crédito', icon: <CreditCardOutlinedIcon />, path: '/credit-card' },
  { 
    text: 'Cadastros', 
    icon: <AppsOutlinedIcon />,
    subItems: [
      { text: 'Categorias', icon: <CategoryOutlinedIcon />, path: '/categories' },
      { text: 'Tipos de Categoria', icon: <ClassOutlinedIcon />, path: '/category-types' },
      { text: 'Subcategorias', icon: <LabelOutlinedIcon />, path: '/subcategories' },
      { text: 'Status de Pagamento', icon: <PaymentsOutlinedIcon />, path: '/payment-statuses' },
      { text: 'Contas Bancárias', icon: <AccountBalanceOutlinedIcon />, path: '/bank-accounts' },
      { text: 'Cartões', icon: <CreditCardOutlinedIcon />, path: '/cards' },
      { text: 'Contatos', icon: <PeopleOutlineOutlinedIcon />, path: '/contacts' },
      { text: 'Centros de Custo', icon: <AccountBalanceOutlinedIcon />, path: '/cost-centers' },
    ]
  },
  { text: 'Configurações', icon: <SettingsOutlinedIcon />, path: '/settings' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Verifica se a rota atual pertence a algum submenu e o mantém aberto
  useEffect(() => {
    const currentPath = location.pathname;
    menuItems.forEach((item) => {
      if (item.subItems && item.subItems.some(subItem => subItem.path === currentPath)) {
        setOpenSubmenu(item.text);
      }
    });
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSubmenuClick = (itemText: string) => {
    setOpenSubmenu(openSubmenu === itemText ? null : itemText);
  };

  const handleMenuItemClick = (path?: string, item?: MenuItem) => {
    if (path) {
      navigate(path);
      setMobileOpen(false);
    } else if (item?.subItems && sidebarCollapsed) {
      // Se for um item com subitens (como Cadastros) e o menu estiver recolhido, expandi-lo
      setSidebarCollapsed(false);
      setTimeout(() => {
        setOpenSubmenu(item.text);
      }, 300); // Aguardar a animação de expansão do menu
    }
  };

  const handleSidebarToggle = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const currentDrawerWidth = sidebarCollapsed ? collapsedDrawerWidth : drawerWidth;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Função para obter o título da página atual
  const getPageTitle = () => {
    let title = 'TrackOne Finance';
    
    // Verificar itens principais
    menuItems.forEach(item => {
      if (item.path === location.pathname) {
        title = item.text;
      }
      
      // Verificar subitens
      if (item.subItems) {
        item.subItems.forEach(subItem => {
          if (subItem.path === location.pathname) {
            title = `${item.text} - ${subItem.text}`;
          }
        });
      }
    });
    
    return title;
  };

  const drawer = (
    <Box sx={{ 
      height: '100%',
      bgcolor: '#2A4B75',
      backgroundImage: 'linear-gradient(180deg, #2A4B75 0%, #3A5F92 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        alignItems: 'center',
        minHeight: '64px',
        px: sidebarCollapsed ? 1 : 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {!sidebarCollapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
            TrackOne
          </Typography>
        )}
        <IconButton 
          onClick={handleSidebarToggle}
          sx={{ 
            color: 'white',
            display: { xs: 'none', sm: 'block' },
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)'
            },
            padding: '4px',
            fontSize: '0.75rem'
          }}
        >
          {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>
      
      <List sx={{ pt: 1, flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' } }}>
        {menuItems.map((item) => {
          // Verificar se o item atual está ativo
          const isMainItemActive = location.pathname === item.path;
          const hasActiveSubitem = item.subItems?.some(subItem => location.pathname === subItem.path);
          const isActive = isMainItemActive || hasActiveSubitem;
          
          return (
            <React.Fragment key={item.text}>
              <Tooltip title={sidebarCollapsed ? item.text : ""} placement="right" arrow>
                <ListItem
                  component="div"
                  onClick={() => {
                    if (item.subItems) {
                      if (sidebarCollapsed) {
                        handleMenuItemClick(undefined, item);
                      } else {
                        handleSubmenuClick(item.text);
                      }
                    } else {
                      handleMenuItemClick(item.path);
                    }
                  }}
                  sx={{
                    color: 'white',
                    minHeight: 40,
                    justifyContent: sidebarCollapsed ? 'center' : 'initial',
                    px: sidebarCollapsed ? 1 : 2,
                    py: 0.75,
                    cursor: 'pointer',
                    mb: 0.5,
                    borderRadius: '0 24px 24px 0',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                    ...(isActive && {
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        height: '60%',
                        width: '4px',
                        bgcolor: '#ffffff',
                        borderRadius: '0 2px 2px 0',
                      },
                    }),
                    ...(item.subItems && openSubmenu === item.text && {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarCollapsed ? 'auto' : 2,
                      justifyContent: 'center',
                      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '1.2rem'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <>
                      <ListItemText 
                        primary={item.text} 
                        sx={{ 
                          opacity: 1,
                          '& .MuiListItemText-primary': {
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 500 : 400,
                            letterSpacing: '0.01em',
                          }
                        }}
                      />
                      {item.subItems && (
                        openSubmenu === item.text ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />
                      )}
                    </>
                  )}
                </ListItem>
              </Tooltip>
              
              {/* Submenu */}
              {item.subItems && !sidebarCollapsed && (
                <Collapse in={openSubmenu === item.text} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ ml: 1.5 }}>
                    {item.subItems.map((subItem) => {
                      const isSubItemActive = location.pathname === subItem.path;
                      
                      return (
                        <Tooltip key={subItem.text} title="" placement="right">
                          <ListItem
                            component="div"
                            onClick={() => handleMenuItemClick(subItem.path)}
                            sx={{
                              color: isSubItemActive ? 'white' : 'rgba(255, 255, 255, 0.85)',
                              minHeight: 36,
                              pl: 2,
                              pr: 1,
                              py: 0.5,
                              mb: 0.25,
                              cursor: 'pointer',
                              borderRadius: '0 20px 20px 0',
                              position: 'relative',
                              fontSize: '0.8rem',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.07)',
                              },
                              ...(isSubItemActive && {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: '25%',
                                  height: '50%',
                                  width: '3px',
                                  bgcolor: '#ffffff',
                                  borderRadius: '0 2px 2px 0',
                                },
                              }),
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 0,
                                mr: 1.5,
                                justifyContent: 'center',
                                color: isSubItemActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.85rem',
                              }}
                            >
                              {subItem.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={subItem.text} 
                              sx={{ 
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.8rem',
                                  fontWeight: isSubItemActive ? 500 : 400,
                                }
                              }}
                            />
                          </ListItem>
                        </Tooltip>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
      
      {/* Informações do usuário e logout */}
      <Box sx={{ mt: 'auto', mb: 1 }}>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
        {!sidebarCollapsed && user && (
          <Box sx={{ px: 2, py: 0.5, mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
              Logado como:
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 400, fontSize: '0.8rem' }}>
              {user.email}
            </Typography>
          </Box>
        )}
        <Tooltip title={sidebarCollapsed ? "Sair" : ""}>
          <ListItem
            component="div"
            onClick={handleLogout}
            sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              minHeight: 40,
              justifyContent: sidebarCollapsed ? 'center' : 'initial',
              px: sidebarCollapsed ? 1 : 2,
              py: 0.75,
              cursor: 'pointer',
              borderRadius: '0 24px 24px 0',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.07)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarCollapsed ? 'auto' : 2,
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {!sidebarCollapsed && (
              <ListItemText 
                primary="Sair" 
                sx={{ 
                  opacity: 1,
                  '& .MuiListItemText-primary': {
                    fontSize: '0.85rem',
                    fontWeight: 400,
                  }
                }}
              />
            )}
          </ListItem>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <CssBaseline />
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
              backgroundImage: 'linear-gradient(180deg, #2A4B75 0%, #3A5F92 100%)',
              boxShadow: '0 0 20px rgba(0,0,0,0.2)',
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
              backgroundImage: 'linear-gradient(180deg, #2A4B75 0%, #3A5F92 100%)',
              transition: 'width 0.3s',
              overflowX: 'hidden',
              boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
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
          bgcolor: '#F9FAFB',
          minHeight: '100vh',
          transition: 'width 0.3s, padding 0.3s',
          overflow: 'hidden',
        }}
      >
        {/* Mobile menu button */}
        <Box sx={{ 
          display: { xs: 'block', sm: 'none' },
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
          bgcolor: '#2A4B75',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
        }}>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ 
              color: '#ffffff',
              p: 1.5
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        
        <Outlet />
      </Box>
    </Box>
  );
}

