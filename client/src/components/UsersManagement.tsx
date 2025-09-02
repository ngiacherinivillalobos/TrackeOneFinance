import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface CostCenter {
  id: number;
  name: string;
  number?: string;
}

interface User {
  id: number;
  email: string;
  cost_center_id?: number;
  created_at: string;
}

interface NewUser {
  email: string;
  password: string;
  cost_center_id?: number;
}

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({ email: '', password: '' });
  const [resetPassword, setResetPassword] = useState({ password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  // Carregar centros de custo e usuários
  useEffect(() => {
    const loadData = async () => {
      try {
        const [costCentersResponse, usersResponse] = await Promise.all([
          api.get('/cost-centers'),
          api.get('/users')
        ]);
        
        setCostCenters(costCentersResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showSnackbar('Erro ao carregar dados', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    setLoading(true);
    loadData();
  }, []);
  

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showSnackbar('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddUser = async () => {
    // Validação
    let valid = true;
    const newErrors = { email: '', password: '' };
    
    if (!newUser.email) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!validateEmail(newUser.email)) {
      newErrors.email = 'Email inválido';
      valid = false;
    }
    
    if (!newUser.password) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      valid = false;
    }
    
    setErrors(newErrors);
    
    if (!valid) return;

    try {
      // Garantir que o centro de custo seja um número ou null
      const userData = {
        ...newUser,
        cost_center_id: newUser.cost_center_id || null
      };
      
      await api.post('/users', userData);
      showSnackbar('Usuário adicionado com sucesso!', 'success');
      setOpenAddDialog(false);
      setNewUser({ email: '', password: '' });
      fetchUsers(); // Recarregar a lista
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      showSnackbar(error.response?.data?.error || 'Erro ao adicionar usuário', 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      showSnackbar('Usuário excluído com sucesso!', 'success');
      fetchUsers(); // Recarregar a lista
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      showSnackbar(error.response?.data?.error || 'Erro ao excluir usuário', 'error');
    }
  };

  const handleOpenResetPassword = (user: User) => {
    setSelectedUser(user);
    setOpenResetDialog(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPassword.password) {
      setErrors({ ...errors, password: 'Senha é obrigatória' });
      return;
    }
    
    if (resetPassword.password.length < 6) {
      setErrors({ ...errors, password: 'Senha deve ter pelo menos 6 caracteres' });
      return;
    }

    try {
      await api.put(`/users/${selectedUser.id}/password`, { password: resetPassword.password });
      showSnackbar('Senha redefinida com sucesso!', 'success');
      setOpenResetDialog(false);
      setResetPassword({ password: '' });
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      showSnackbar(error.response?.data?.error || 'Erro ao redefinir senha', 'error');
    }
  };

  const handleUpdateCostCenter = async (userId: number, costCenterId: number | null) => {
    try {
      await api.put(`/users/${userId}/cost-center`, { cost_center_id: costCenterId });
      showSnackbar('Centro de custo atualizado com sucesso!', 'success');
      fetchUsers(); // Recarregar a lista
    } catch (error: any) {
      console.error('Erro ao atualizar centro de custo:', error);
      showSnackbar(error.response?.data?.error || 'Erro ao atualizar centro de custo', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Gerenciamento de Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
        >
          Adicionar Usuário
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Centro de Custo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Data de Criação</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.cost_center_id ? 
                      (() => {
                        const costCenter = costCenters.find(cc => cc.id === user.cost_center_id);
                        return costCenter ? 
                          (costCenter.number ? `${costCenter.number} - ${costCenter.name}` : costCenter.name) : 
                          `ID: ${user.cost_center_id}`;
                      })() : 
                      'Nenhum'}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (user.created_at.includes('T')) {
                        return new Date(user.created_at).toLocaleDateString('pt-BR');
                      } else {
                        // Usar formato UTC para evitar problemas de fuso horário
                        return new Date(user.created_at + 'T00:00:00Z').toLocaleDateString('pt-BR');
                      }
                    })()}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenResetPassword(user)}
                      title="Redefinir Senha"
                    >
                      <LockResetIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Excluir Usuário"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para adicionar usuário */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Adicionar Novo Usuário</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Senha"
            type="password"
            fullWidth
            variant="outlined"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            error={!!errors.password}
            helperText={errors.password}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={costCenters}
            getOptionLabel={(option: CostCenter) => `${option.name}${option.number ? ` (${option.number})` : ''}`}
            value={costCenters.find(cc => cc.id === newUser.cost_center_id) || null}
            onChange={(event: any, newValue: CostCenter | null) => {
              setNewUser({ 
                ...newUser, 
                cost_center_id: newValue?.id 
              });
            }}
            renderInput={(params: any) => (
              <TextField 
                {...params} 
                label="Centro de Custo" 
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddUser} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para redefinir senha */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Redefinir Senha</DialogTitle>
        {selectedUser && (
          <DialogContent sx={{ minWidth: 400 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Redefinindo senha para: <strong>{selectedUser.email}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Aqui você também pode alterar o centro de custo associado ao usuário.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Nova Senha"
              type="password"
              fullWidth
              variant="outlined"
              value={resetPassword.password}
              onChange={(e) => setResetPassword({ ...resetPassword, password: e.target.value })}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 2 }}
            />
            <Autocomplete
              options={costCenters}
              getOptionLabel={(option) => `${option.name}${option.number ? ` (${option.number})` : ''}`}
              value={costCenters.find(cc => cc.id === selectedUser.cost_center_id) || null}
              onChange={(event, newValue) => {
                // Atualizar centro de custo imediatamente
                handleUpdateCostCenter(selectedUser.id, newValue?.id || null);
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Centro de Custo" 
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Cancelar</Button>
          <Button onClick={handleResetPassword} variant="contained">Redefinir</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};