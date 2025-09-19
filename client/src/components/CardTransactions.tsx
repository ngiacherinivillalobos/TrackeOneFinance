import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Alert,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { colors } from '../theme/modernTheme';
import { 
  cardTransactionService, 
  CreateInstallmentsRequest, 
  CardTransaction 
} from '../services/cardTransactionService';
import { cardService, Card } from '../services/cardService';
import { categoryService, Category } from '../services/categoryService';

interface CardTransactionsProps {
  selectedCard?: Card;
}

export default function CardTransactions({ selectedCard }: CardTransactionsProps) {
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CardTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const [formData, setFormData] = useState<CreateInstallmentsRequest>({
    description: '',
    total_amount: 0,
    total_installments: 1,
    card_id: selectedCard?.id || 0,
    category_id: undefined,
    subcategory_id: undefined,
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar cartões
      const cardsData = await cardService.list();
      setCards(cardsData);
      
      // Carregar categorias
      const categoriesData = await categoryService.list();
      setCategories(categoriesData);
      
      // Carregar transações se há cartão selecionado
      if (selectedCard?.id) {
        const transactionsData = await cardTransactionService.getFiltered({
          card_id: selectedCard.id,
          is_installment: true
        });
        setTransactions(transactionsData);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Erro ao carregar dados');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCard]);

  const handleOpen = () => {
    setFormData({
      description: '',
      total_amount: 0,
      total_installments: 1,
      card_id: selectedCard?.id || 0,
      category_id: undefined,
      subcategory_id: undefined,
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setEditingTransaction(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTransaction(null);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.card_id) {
      setMessage('Selecione um cartão de crédito');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      
      // Encontrar o cartão selecionado
      const selectedCard = cards.find(card => card.id === formData.card_id);
      
      // Determinar a data correta com base na data de fechamento do cartão
      let transactionDate = new Date(formData.transaction_date);
      
      if (selectedCard && selectedCard.closing_day) {
        const transactionDay = transactionDate.getDate();
        
        // Se a data da transação for maior ou igual à data de fechamento,
        // calcular para o próximo mês (próxima fatura)
        if (transactionDay >= selectedCard.closing_day) {
          transactionDate.setMonth(transactionDate.getMonth() + 1);
        }
      }
      
      const adjustedFormData = {
        ...formData,
        transaction_date: transactionDate.toISOString().split('T')[0]
      };

      if (editingTransaction) {
        // Editar transação individual
        await cardTransactionService.update(editingTransaction.id!, {
          description: formData.description,
          amount: formData.total_amount,
          type: 'expense',
          category_id: formData.category_id,
          subcategory_id: formData.subcategory_id,
          card_id: formData.card_id,
          transaction_date: adjustedFormData.transaction_date
        });
        setMessage('Transação atualizada com sucesso!');
      } else {
        // Criar parcelamentos
        const result = await cardTransactionService.createInstallments(adjustedFormData);
        setMessage(`${result.transactions.length} parcelas criadas com sucesso!`);
      }
      
      setMessageType('success');
      await loadData();
      handleClose();
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      setMessage('Erro ao salvar transação');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: CardTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      total_amount: transaction.amount,
      total_installments: transaction.total_installments || 1,
      card_id: transaction.card_id,
      category_id: transaction.category_id,
      subcategory_id: transaction.subcategory_id,
      transaction_date: transaction.transaction_date
    });
    setOpen(true);
  };

  const handleDelete = async (transaction: CardTransaction) => {
    if (window.confirm(`Tem certeza que deseja excluir a transação "${transaction.description}"?`)) {
      try {
        await cardTransactionService.delete(transaction.id!);
        setMessage('Transação excluída com sucesso!');
        setMessageType('success');
        await loadData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setMessage('Erro ao excluir transação');
        setMessageType('error');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  if (!selectedCard) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CreditCardIcon sx={{ fontSize: 48, color: colors.gray[400], mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Selecione um cartão para gerenciar suas transações
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Transações - {selectedCard.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Gerencie as transações parceladas do cartão
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{
            bgcolor: colors.primary[600],
            '&:hover': { bgcolor: colors.primary[700] }
          }}
        >
          Nova Transação
        </Button>
      </Box>

      {/* Messages */}
      {message && (
        <Alert 
          severity={messageType} 
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {/* Transactions Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: colors.gray[50] }}>
              <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Valor</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Parcela</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Categoria</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} hover>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>
                  {transaction.is_installment && (
                    <Chip
                      label={`${transaction.installment_number}/${transaction.total_installments}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                <TableCell>
                  {categories.find(c => c.id === transaction.category_id)?.name || '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleEdit(transaction)}
                    size="small"
                    sx={{ color: colors.primary[600] }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(transaction)}
                    size="small"
                    sx={{ color: colors.error[600] }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    Nenhuma transação encontrada para este cartão
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTransaction ? 'Editar Transação' : 'Nova Transação Parcelada'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Descrição"
                fullWidth
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Valor Total"
                  type="number"
                  fullWidth
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  required
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                />

                {!editingTransaction && (
                  <TextField
                    label="Número de Parcelas"
                    type="number"
                    fullWidth
                    value={formData.total_installments}
                    onChange={(e) => setFormData({ ...formData, total_installments: parseInt(e.target.value) || 1 })}
                    required
                    inputProps={{ min: 1, max: 99 }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Cartão</InputLabel>
                  <Select
                    value={formData.card_id}
                    onChange={(e) => setFormData({ ...formData, card_id: Number(e.target.value) })}
                    required
                  >
                    {cards.map((card) => (
                      <MenuItem key={card.id} value={card.id}>
                        {card.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Data da Transação"
                  type="date"
                  fullWidth
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) || undefined })}
                >
                  <MenuItem value="">Nenhuma</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!editingTransaction && formData.total_installments > 1 && (
                <Alert severity="info">
                  Valor por parcela: {formatCurrency(formData.total_amount / formData.total_installments)}
                  <br />
                  Serão criadas {formData.total_installments} transações mensais
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: colors.primary[600],
                '&:hover': { bgcolor: colors.primary[700] }
              }}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}