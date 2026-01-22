import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const checkServer = async () => {
    try {
      setServerStatus('checking');
      await api.get('/health');
      setServerStatus('online');
    } catch (error) {
      console.error('Erro ao verificar status do servidor:', error);
      setServerStatus('offline');
      setSnackbar({
        open: true,
        message: 'Não foi possível conectar ao servidor. Em ambientes de produção, o primeiro acesso pode demorar até 2 minutos para ativar o servidor.',
        severity: 'error'
      });
    }
  };

  // Verificar se o servidor está online
  useEffect(() => {
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
        message: 'Não foi possível conectar ao servidor. Em ambientes de produção, o primeiro acesso pode demorar até 2 minutos para ativar o servidor.',
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
      
      // Verificar se o erro é relacionado a 2FA
      if (error.response?.status === 200 && error.response?.data?.requires2FA) {
        setRequires2FA(true);
        setTempToken(error.response?.data?.tempToken);
        setSnackbar({
          open: true,
          message: 'Código de autenticação 2FA obrigatório',
          severity: 'error'
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: error.message || 'Erro ao autenticar. Verifique suas credenciais ou sua conexão com o servidor.', 
          severity: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setSnackbar({
        open: true,
        message: 'Código deve conter 6 dígitos',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // Fazer o login novamente com o código 2FA
      const response = await api.post('/auth/login', {
        email,
        password,
        twoFactorCode
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setSnackbar({ open: true, message: 'Login realizado com sucesso!', severity: 'success' });
        
        // Usar o contexto para fazer login
        await login(email, password, twoFactorCode);
        
        setTimeout(() => {
          setRequires2FA(false);
          setTwoFactorCode('');
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Erro ao validar 2FA:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Código 2FA inválido',
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
        <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
          {requires2FA ? 'Insira o código de autenticação 2FA' : 'Faça login para continuar'}
        </Typography>
        
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
            Não foi possível conectar ao servidor. Em ambientes de produção, o primeiro acesso pode demorar até 2 minutos para ativar o servidor.
            <Button 
              variant="outlined" 
              size="small" 
              color="error" 
              sx={{ mt: 1, display: 'block', mx: 'auto' }} 
              onClick={checkServer}
            >
              Tentar novamente
            </Button>
          </Alert>
        )}
        
        {!requires2FA ? (
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
              {loading ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Entrando...
              </Box> : 'Entrar'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Digite o código de 6 dígitos do seu aplicativo autenticador
            </Alert>
            <TextField
              label="Código 2FA"
              type="text"
              inputMode="numeric"
              fullWidth
              margin="normal"
              value={twoFactorCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwoFactorCode(value);
              }}
              maxLength={6}
              placeholder="000000"
              required
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              disabled={loading || twoFactorCode.length !== 6} 
              sx={{ mt: 2, mb: 2 }}
            >
              {loading ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Validando...
              </Box> : 'Confirmar'}
            </Button>
            <Button 
              variant="text" 
              color="secondary" 
              fullWidth 
              onClick={() => {
                setRequires2FA(false);
                setTwoFactorCode('');
              }}
              disabled={loading}
            >
              Voltar
            </Button>
          </form>
        )}

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