import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Verificar se o servidor está online
  useEffect(() => {
    const checkServer = async () => {
      try {
        setServerStatus('checking');
        await api.get('/api/test');
        setServerStatus('online');
      } catch (error) {
        console.error('Erro ao verificar status do servidor:', error);
        setServerStatus('offline');
        setSnackbar({
          open: true,
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.',
          severity: 'error'
        });
      }
    };
    
    checkServer();
  }, []);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar se há um estado com redirecionamento
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se o servidor está online antes de tentar fazer login
    if (serverStatus === 'offline') {
      setSnackbar({
        open: true,
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      setSnackbar({ open: true, message: 'Login realizado com sucesso!', severity: 'success' });
      
      // Redirecionar após login bem-sucedido
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Erro de login:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || 'Erro ao autenticar. Verifique suas credenciais ou sua conexão com o servidor.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" align="center" gutterBottom>TrackOne Finance</Typography>
        <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>Faça login para continuar</Typography>
        
        {serverStatus === 'checking' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
            <CircularProgress size={30} />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Verificando conexão com o servidor...
            </Typography>
          </Box>
        )}
        
        {serverStatus === 'offline' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="E-mail"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={loading || serverStatus !== 'online'} 
            sx={{ mt: 2, mb: 2 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default Login;