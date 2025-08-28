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
import paymentStatusService, { PaymentStatus } from '../services/paymentStatusService';

export default function PaymentStatuses() {
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<PaymentStatus | null>(null);
  const [formData, setFormData] = useState<Omit<PaymentStatus, 'id'>>({
    name: ''
  });

  const loadData = async () => {
    try {
      const data = await paymentStatusService.list();
      setPaymentStatuses(data);
    } catch (error) {
      console.error('Error loading payment statuses:', error);
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
    setEditingPaymentStatus(null);
    setFormData({ name: '' });
  };

  const handleEdit = (paymentStatus: PaymentStatus) => {
    setEditingPaymentStatus(paymentStatus);
    setFormData({ name: paymentStatus.name });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este status de pagamento?')) {
      try {
        await paymentStatusService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting payment status:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPaymentStatus) {
        await paymentStatusService.update(editingPaymentStatus.id!, formData);
      } else {
        await paymentStatusService.create(formData);
      }
      await loadData();
      handleClose();
    } catch (error) {
      console.error('Error saving payment status:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Novo Status de Pagamento
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentStatuses.map((paymentStatus) => (
              <TableRow key={paymentStatus.id}>
                <TableCell>{paymentStatus.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(paymentStatus)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(paymentStatus.id!)}>
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
          <DialogTitle>{editingPaymentStatus ? 'Editar Status de Pagamento' : 'Novo Status de Pagamento'}</DialogTitle>
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
