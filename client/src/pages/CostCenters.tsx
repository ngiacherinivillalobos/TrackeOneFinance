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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CostCenter, costCenterService } from '../services/costCenterService';

export default function CostCenters() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState<Omit<CostCenter, 'id'>>({
    name: '',
    number: ''
  });

  const loadData = async () => {
    try {
      const data = await costCenterService.list();
      setCostCenters(data);
    } catch (error) {
      console.error('Error loading cost centers:', error);
    }
  };

  useEffect(() => {
    loadData();
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Novo Centro de Custo
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Número</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costCenters.map((costCenter) => (
              <TableRow key={costCenter.id}>
                <TableCell>{costCenter.name}</TableCell>
                <TableCell>{costCenter.number || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(costCenter)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(costCenter.id!)}>
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
    </div>
  );
}
