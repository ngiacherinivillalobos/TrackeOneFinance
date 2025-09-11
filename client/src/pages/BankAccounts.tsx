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

  // Função para formatar valores monetários como no MonthlyControl
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para converter valores de forma segura
  const getSafeAmount = (amount: any): number => {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

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
    const balanceValue = getSafeAmount(bankAccount.balance);
    const formattedBalance = balanceValue !== 0 ? 
      balanceValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) : '';
    
    setFormData({
      name: bankAccount.name,
      agency: bankAccount.agency || '',
      account_number: bankAccount.account_number || '',
      bank_name: bankAccount.bank_name || '',
      balance: formattedBalance as any
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
      // Converter o valor formatado para número antes de enviar
      const parseBrazilianNumber = (str: string): number => {
        if (typeof str === 'number') return str;
        if (!str || str === '') return 0;
        
        str = str.toString().trim();
        
        // Se não tem vírgula, trata como número inteiro
        if (!str.includes(',')) {
          // Remove pontos (milhares) e converte
          return parseFloat(str.replace(/\./g, '')) || 0;
        }
        
        // Divide em parte inteira e decimal
        const parts = str.split(',');
        const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
        const decimalPart = parts[1] || '00'; // Parte decimal
        
        // Reconstrói o número no formato americano
        const americanFormat = integerPart + '.' + decimalPart;
        return parseFloat(americanFormat) || 0;
      };

      const numericBalance = parseBrazilianNumber(formData.balance as any);
      const dataToSend = {
        ...formData,
        balance: numericBalance
      };

      if (editingBankAccount) {
        await bankAccountService.update(editingBankAccount.id!, dataToSend);
      } else {
        await bankAccountService.create(dataToSend);
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
                    formatCurrency(getSafeAmount(bankAccount.balance)) : 
                    formatCurrency(0)
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
              type="text"
              fullWidth
              value={formData.balance || ''}
              onChange={(e) => {
                // Permite apenas números, vírgula e ponto
                const value = e.target.value.replace(/[^0-9.,]/g, '');
                setFormData({ ...formData, balance: value as any });
              }}
              onBlur={(e) => {
                // Formatar o valor quando perder o foco
                const value = e.target.value.replace(/[^0-9.,]/g, '');
                if (value) {
                  // Função para converter formato brasileiro para número
                  const parseBrazilianNumber = (str: string): number => {
                    // Remove espaços
                    str = str.trim();
                    
                    // Se não tem vírgula, trata como número inteiro
                    if (!str.includes(',')) {
                      // Remove pontos (milhares) e converte
                      return parseFloat(str.replace(/\./g, '')) || 0;
                    }
                    
                    // Divide em parte inteira e decimal
                    const parts = str.split(',');
                    const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
                    const decimalPart = parts[1] || '00'; // Parte decimal
                    
                    // Reconstrói o número no formato americano
                    const americanFormat = integerPart + '.' + decimalPart;
                    return parseFloat(americanFormat) || 0;
                  };
                  
                  const numericValue = parseBrazilianNumber(value);
                  if (!isNaN(numericValue) && numericValue >= 0) {
                    const formattedValue = numericValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                    setFormData({ ...formData, balance: formattedValue as any });
                  }
                }
              }}
              onFocus={(e) => {
                // Converter para formato de edição (sem formatação de milhares)
                const value = e.target.value;
                if (value) {
                  // Remove formatação e mantém apenas números e vírgula
                  const parseBrazilianNumber = (str: string): number => {
                    str = str.trim();
                    if (!str.includes(',')) {
                      return parseFloat(str.replace(/\./g, '')) || 0;
                    }
                    const parts = str.split(',');
                    const integerPart = parts[0].replace(/\./g, '');
                    const decimalPart = parts[1] || '00';
                    const americanFormat = integerPart + '.' + decimalPart;
                    return parseFloat(americanFormat) || 0;
                  };
                  
                  const numericValue = parseBrazilianNumber(value);
                  if (!isNaN(numericValue)) {
                    // Converte para formato editável (sem pontos de milhar)
                    const editableValue = numericValue.toFixed(2).replace('.', ',');
                    setFormData({ ...formData, balance: editableValue as any });
                  }
                }
              }}
              InputProps={{
                startAdornment: <Box sx={{ mr: 1 }}>R$</Box>
              }}
              placeholder="0,00"
              helperText="Use vírgula para decimais (ex: 1.500,00)"
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
