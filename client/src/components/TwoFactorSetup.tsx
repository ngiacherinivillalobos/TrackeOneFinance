import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import api from '../lib/axios';

interface TwoFactorSetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: 'setup' | 'disable';
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ open, onClose, onSuccess, mode }) => {
  const [step, setStep] = useState<'initial' | 'qrcode' | 'verify' | 'disable'>('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSetup2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep('qrcode');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar configuração de 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Código deve conter 6 dígitos');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/2fa/confirm', {
        secret,
        verificationCode
      });
      
      setSuccess(response.data.message);
      setStep('verify');
      
      setTimeout(() => {
        setStep('initial');
        setQrCode('');
        setSecret('');
        setVerificationCode('');
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao confirmar código 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    setError('');

    if (!password) {
      setError('Senha obrigatória para desabilitar 2FA');
      setLoading(false);
      return;
    }

    try {
      const response = await api.delete('/auth/2fa/disable', {
        data: { password }
      });
      
      setSuccess(response.data.message);
      
      setTimeout(() => {
        setStep('initial');
        setPassword('');
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao desabilitar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStep('initial');
      setQrCode('');
      setSecret('');
      setVerificationCode('');
      setPassword('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'setup' ? 'Habilitar Autenticação em Dois Fatores' : 'Desabilitar 2FA'}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {mode === 'setup' ? (
          <>
            {step === 'initial' && (
              <Box>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  A autenticação em dois fatores adiciona uma camada extra de segurança à sua conta.
                  Você precisará usar um aplicativo autenticador (como Google Authenticator ou Authy) 
                  para acessar sua conta.
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, fontWeight: 500 }}>
                  Clique em "Próximo" para continuar com a configuração.
                </Typography>
              </Box>
            )}

            {step === 'qrcode' && (
              <Box>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  1. Escaneie o código QR abaixo com seu aplicativo autenticador:
                </Typography>
                
                {qrCode && (
                  <Paper
                    sx={{
                      p: 2,
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center',
                      bgcolor: '#f5f5f5'
                    }}
                  >
                    <img src={qrCode} alt="QR Code 2FA" style={{ maxWidth: '250px' }} />
                  </Paper>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  2. Ou insira a chave manualmente:
                </Typography>
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-all',
                      userSelect: 'all',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}
                  >
                    {secret}
                  </Typography>
                </Paper>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  3. Insira o código de 6 dígitos gerado pelo seu autenticador:
                </Typography>
                <TextField
                  fullWidth
                  label="Código 2FA"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  disabled={loading}
                  sx={{ mb: 2 }}
                />
              </Box>
            )}

            {step === 'verify' && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                  ✓ 2FA Habilitado com Sucesso!
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Fechando diálogo...
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <>
            {step === 'initial' && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Você está prestes a desabilitar a autenticação em dois fatores.
                  Sua conta se tornará menos segura.
                </Alert>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Para confirmar, digite sua senha:
                </Typography>
                <TextField
                  fullWidth
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </Box>
            )}

            {step === 'disable' && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'warning.main' }}>
                  ✓ 2FA Desabilitado!
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Fechando diálogo...
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        
        {mode === 'setup' ? (
          <>
            {step === 'initial' && (
              <Button
                onClick={handleSetup2FA}
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Próximo'}
              </Button>
            )}
            {step === 'qrcode' && (
              <Button
                onClick={handleVerifyCode}
                variant="contained"
                disabled={loading || !verificationCode}
              >
                {loading ? <CircularProgress size={20} /> : 'Confirmar'}
              </Button>
            )}
          </>
        ) : (
          <>
            {step === 'initial' && (
              <Button
                onClick={handleDisable2FA}
                variant="contained"
                color="warning"
                disabled={loading || !password}
              >
                {loading ? <CircularProgress size={20} /> : 'Desabilitar'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorSetup;
