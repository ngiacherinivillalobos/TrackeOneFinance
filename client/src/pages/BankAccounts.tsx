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
import { BankAccount, bankAccountService } from '../services/bankAccountService';

export default function BankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<Omit<BankAccount, 'id'>>({
    name: '',
    agency: '',
    account_number: '',
    bank_name: '',
    balance: 0
  });

  const loadData = async () => {
    try {
      const data = await bankAccountService.list();
      setBankAccounts(data);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
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
    setEditingBankAccount(null);
    setFormData({ name: '', agency: '', account_number: '', bank_name: '', balance: 0 });
  };

  const handleEdit = (bankAccount: BankAccount) => {
    setEditingBankAccount(bankAccount);
    setFormData({
      name: bankAccount.name,
      agency: bankAccount.agency || '',
      account_number: bankAccount.account_number || '',
      bank_name: bankAccount.bank_name || '',
      balance: bankAccount.balance || 0
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta bancária?')) {
      try {
        await bankAccountService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting bank account:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBankAccount) {
        await bankAccountService.update(editingBankAccount.id!, formData);
      } else {
        await bankAccountService.create(formData);
      }
      await loadData();
      handleClose();
    } catch (error) {
      console.error('Error saving bank account:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Nova Conta Bancária
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Banco</TableCell>
              <TableCell>Agência</TableCell>
              <TableCell>Conta</TableCell>
              <TableCell align="right">Saldo Inicial (R$)</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bankAccounts.map((bankAccount) => (
              <TableRow key={bankAccount.id}>
                <TableCell>{bankAccount.name}</TableCell>
                <TableCell>{bankAccount.bank_name || '-'}</TableCell>
                <TableCell>{bankAccount.agency || '-'}</TableCell>
                <TableCell>{bankAccount.account_number || '-'}</TableCell>
                <TableCell align="right">
                  {bankAccount.balance !== undefined ? 
                    `R$ ${parseFloat(bankAccount.balance.toString()).toFixed(2).replace('.', ',')}` : 
                    'R$ 0,00'
                  }
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(bankAccount)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(bankAccount.id!)}>
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
          <DialogTitle>{editingBankAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
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
              label="Banco"
              type="text"
              fullWidth
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Agência"
              type="text"
              fullWidth
              value={formData.agency}
              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Número da Conta"
              type="text"
              fullWidth
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Saldo Inicial (R$)"
              type="number"
              fullWidth
              value={formData.balance || 0}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              inputProps={{ 
                step: "0.01",
                min: "0"
              }}
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
