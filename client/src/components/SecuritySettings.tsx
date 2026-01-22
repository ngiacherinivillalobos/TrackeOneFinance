import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import TwoFactorSetup from './TwoFactorSetup';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';
import { colors } from '../theme/modernTheme';

const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carregar status de 2FA ao montar o componente
  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/2fa/status');
      setTwoFactorEnabled(response.data.twoFactorEnabled);
    } catch (error: any) {
      console.error('Erro ao carregar status de 2FA:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar configurações de segurança',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Abrir diálogo de setup
      setSetupDialogOpen(true);
    } else {
      // Abrir diálogo de desabilitar
      setDisableDialogOpen(true);
    }
  };

  const handleSetupSuccess = () => {
    setTwoFactorEnabled(true);
    setSnackbar({
      open: true,
      message: '2FA habilitado com sucesso!',
      severity: 'success'
    });
  };

  const handleDisableSuccess = () => {
    setTwoFactorEnabled(false);
    setSnackbar({
      open: true,
      message: '2FA desabilitado com sucesso!',
      severity: 'success'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ mr: 1, color: colors.primary[500], fontSize: 28 }} />
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Configurações de Segurança
        </Typography>
      </Box>

      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ mb: 2 }}
        >
          {snackbar.message}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${colors.gray[200]}`
        }}
      >
        <Stack spacing={3}>
          {/* Seção de Email */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Email da Conta
            </Typography>
            <Typography variant="body2" sx={{ color: colors.gray[600], mb: 2 }}>
              {user?.email}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.gray[500] }}>
              Seu email de acesso não pode ser alterado
            </Typography>
          </Box>

          <Divider />

          {/* Seção de Autenticação em Dois Fatores */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Autenticação em Dois Fatores (2FA)
                </Typography>
                <Typography variant="body2" sx={{ color: colors.gray[600], mb: 2 }}>
                  {twoFactorEnabled
                    ? 'Sua conta está protegida com 2FA. Você precisará fornecer um código de verificação ao fazer login.'
                    : 'Adicione uma camada extra de segurança à sua conta usando autenticação em dois fatores.'}
                </Typography>

                {twoFactorEnabled && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      mb: 2,
                      bgcolor: 'success.light',
                      borderRadius: 1,
                      border: `1px solid ${colors.success[200]}`
                    }}
                  >
                    <VerifiedIcon
                      sx={{
                        mr: 1.5,
                        color: 'success.main',
                        fontSize: 20
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 500 }}>
                      2FA ativo na sua conta
                    </Typography>
                  </Box>
                )}
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={twoFactorEnabled}
                    onChange={handleToggle2FA}
                    disabled={loading}
                  />
                }
                label=""
                sx={{ ml: 2 }}
              />
            </Box>

            {!twoFactorEnabled && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setSetupDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Configurar 2FA
              </Button>
            )}

            {twoFactorEnabled && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setDisableDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Desabilitar 2FA
              </Button>
            )}
          </Box>

          <Divider />

          {/* Dica de Segurança */}
          <Alert severity="info">
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              💡 Dica de Segurança
            </Typography>
            <Typography variant="caption">
              Use um aplicativo autenticador confiável como Google Authenticator, Microsoft Authenticator ou Authy.
              Guarde seus códigos de backup em um local seguro.
            </Typography>
          </Alert>
        </Stack>
      </Paper>

      {/* Diálogos */}
      <TwoFactorSetup
        open={setupDialogOpen}
        onClose={() => setSetupDialogOpen(false)}
        onSuccess={handleSetupSuccess}
        mode="setup"
      />

      <TwoFactorSetup
        open={disableDialogOpen}
        onClose={() => setDisableDialogOpen(false)}
        onSuccess={handleDisableSuccess}
        mode="disable"
      />
    </Box>
  );
};

export default SecuritySettings;
