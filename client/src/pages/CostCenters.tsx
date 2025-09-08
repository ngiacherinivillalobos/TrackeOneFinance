import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Snackbar,
  Alert,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ListItemText,
  Checkbox,
  OutlinedInput,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { CostCenter, costCenterService } from '../services/costCenterService';
import api from '../lib/axios';

interface User {
  id: number;
  email: string;
  cost_center_id?: number;
  created_at: string;
}

export default function CostCenters() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState<Omit<CostCenter, 'id'>>({
    name: '',
    number: ''
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadData = async () => {
    try {
      const data = await costCenterService.list();
      setCostCenters(data);
    } catch (error) {
      console.error('Error loading cost centers:', error);
      showSnackbar('Erro ao carregar centros de custo', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      showSnackbar('Erro ao carregar usuários', 'error');
    }
  };

  useEffect(() => {
    loadData();
    loadUsers();
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCostCenter(null);
    setFormData({ name: '', number: '' });
  };

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setFormData({
      name: costCenter.name,
      number: costCenter.number || ''
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este centro de custo?')) {
      try {
        await costCenterService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting cost center:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCostCenter) {
        await costCenterService.update(editingCostCenter.id!, formData);
      } else {
        await costCenterService.create(formData);
      }
      await loadData();
      handleClose();
    } catch (error) {
      console.error('Error saving cost center:', error);
    }
  };
  
  const handleOpenUserDialog = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    // Filtrar usuários que já estão associados a este centro de custo
    const associatedUsers = users
      .filter(user => user.cost_center_id === costCenter.id)
      .map(user => user.id);
    setSelectedUsers(associatedUsers);
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setSelectedCostCenter(null);
    setSelectedUsers([]);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSaveUserAssociations = async () => {
    if (!selectedCostCenter) return;
    
    try {
      // Para cada usuário, verificar se está selecionado ou não
      for (const user of users) {
        const shouldBeAssociated = selectedUsers.includes(user.id);
        const isCurrentlyAssociated = user.cost_center_id === selectedCostCenter.id;
        
        // Se o estado mudou, atualizar
        if (shouldBeAssociated !== isCurrentlyAssociated) {
          await api.put(`/users/${user.id}/cost-center`, { 
            cost_center_id: shouldBeAssociated ? selectedCostCenter.id : null 
          });
        }
      }
      
      // Recarregar usuários para atualizar a lista
      await loadUsers();
      showSnackbar('Associações de usuários atualizadas com sucesso!', 'success');
      handleCloseUserDialog();
    } catch (error) {
      console.error('Erro ao atualizar associações de usuários:', error);
      showSnackbar('Erro ao atualizar associações de usuários', 'error');
    }
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Centros de Custo
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Novo Centro de Custo
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Número</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Usuários Associados</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costCenters.map((costCenter) => (
              <TableRow key={costCenter.id} hover>
                <TableCell>{costCenter.name}</TableCell>
                <TableCell>{costCenter.number || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {users
                      .filter(user => user.cost_center_id === costCenter.id)
                      .map(user => (
                        <Chip 
                          key={user.id} 
                          label={user.email.split('@')[0]} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#e3f2fd', 
                            color: '#0d47a1',
                            '&:hover': { bgcolor: '#bbdefb' } 
                          }} 
                        />
                      ))}
                    <IconButton 
                      color="primary" 
                      size="small" 
                      onClick={() => handleOpenUserDialog(costCenter)}
                      sx={{ ml: 1 }}
                      title="Gerenciar usuários"
                    >
                      <PeopleIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(costCenter)} title="Editar">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(costCenter.id!)} title="Excluir">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nome"
              type="text"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Número"
              type="text"
              fullWidth
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Dialog de Associação de Usuários */}
      <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="md">
        <DialogTitle>
          Gerenciar Usuários para {selectedCostCenter?.name}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 500 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Selecione os usuários que devem estar associados a este centro de custo.
              Usuários associados irão ver automaticamente os dados deste centro ao fazer login.
            </Typography>
          </Box>
          
          <FormControl fullWidth>
            <InputLabel id="users-select-label">Usuários</InputLabel>
            <Select
              labelId="users-select-label"
              multiple
              value={selectedUsers}
              onChange={(e) => setSelectedUsers(e.target.value as number[])}
              input={<OutlinedInput label="Usuários" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const user = users.find(u => u.id === value);
                    return (
                      <Chip 
                        key={value} 
                        label={user ? user.email : value} 
                        size="small" 
                      />
                    );
                  })}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  },
                },
              }}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Checkbox checked={selectedUsers.indexOf(user.id) > -1} />
                  <ListItemText primary={user.email} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancelar</Button>
          <Button onClick={handleSaveUserAssociations} color="primary" variant="contained">
            Salvar
          </Button>
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
    </div>
  );
}