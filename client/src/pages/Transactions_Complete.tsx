import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Typography,
  IconButton,
  Chip,
  Box,
  FormControlLabel,
  Switch,
  Menu,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Stack,
  Divider,
  TablePagination,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingDown as ExpenseIcon,
  TrendingUp as IncomeIcon,
  ShowChart as InvestmentIcon,
  ContentCopy as ContentCopyIcon,
  Add as AddIcon,
  ArrowDropDown as ArrowDropDownIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import api from '../services/api';

// Interfaces
interface Transaction {
  id?: number;
  description: string;
  amount: number;
  transaction_type: 'Despesa' | 'Receita' | 'Investimento';
  transaction_date: string;
  category_id?: number;
  subcategory_id?: number;
  payment_status_id?: number;
  contact_id?: number;
  cost_center_id?: number;
  is_recurring: boolean;
  recurrence_type?: 'unica' | 'mensal' | 'semanal' | 'anual';
  recurrence_count?: number;
  is_paid?: boolean;
  
  // Para exibição
  category_name?: string;
  subcategory_name?: string;
  payment_status_name?: string;
  contact_name?: string;
  cost_center_name?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

interface PaymentStatus {
  id: number;
  name: string;
}

interface Contact {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  name: string;
  number?: string;
}

interface RecurrencePreview {
  creation_date: string;
  due_date: string;
  description: string;
  amount: number;
}

export default function Transactions() {
  // Estados principais
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  
  // Estados de controle
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransactionType, setNewTransactionType] = useState<'Despesa' | 'Receita' | 'Investimento'>('Despesa');
  const [newTransactionMenuAnchorEl, setNewTransactionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    category_id: '',
    subcategory_id: '',
    payment_status_id: '',
    contact_id: '',
    cost_center_id: '',
    transaction_type: '',
    only_pending: false
  });

  // Estado do formulário
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transaction_date: '',
    category_id: '',
    subcategory_id: '',
    payment_status_id: '',
    contact_id: '',
    cost_center_id: '',
    transaction_type: 'Despesa' as 'Despesa' | 'Receita' | 'Investimento',
    is_recurring: false,
    recurrence_type: 'mensal' as 'unica' | 'mensal' | 'semanal' | 'anual',
    recurrence_count: 1,
    is_paid: false
  });

  // Estado para preview de recorrências
  const [recurrencePreview, setRecurrencePreview] = useState<RecurrencePreview[]>([]);

  // Estados de notificação
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Estados de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Carregamento inicial
  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadSubcategories();
    loadPaymentStatuses();
    loadContacts();
    loadCostCenters();
  }, []);

  // Recarregar quando filtros mudam
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  // Atualizar preview de recorrências quando dados do formulário mudam
  useEffect(() => {
    if (formData.is_recurring && formData.transaction_date && formData.amount) {
      generateRecurrencePreview();
    } else {
      setRecurrencePreview([]);
    }
  }, [formData.is_recurring, formData.recurrence_type, formData.recurrence_count, formData.transaction_date, formData.amount, formData.description]);

  // Funções de carregamento
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions', { params: filters });
      setTransactions(response.data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      showSnackbar('Erro ao carregar transações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadSubcategories = async () => {
    try {
      const response = await api.get('/subcategories');
      setSubcategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error);
    }
  };

  const loadPaymentStatuses = async () => {
    try {
      const response = await api.get('/payment-statuses');
      setPaymentStatuses(response.data);
    } catch (error) {
      console.error('Erro ao carregar status de pagamento:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await api.get('/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const loadCostCenters = async () => {
    try {
      const response = await api.get('/cost-centers');
      setCostCenters(response.data);
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error);
    }
  };

  // Função para gerar preview de recorrências
  const generateRecurrencePreview = () => {
    if (!formData.transaction_date || !formData.amount || formData.recurrence_count < 1) {
      setRecurrencePreview([]);
      return;
    }

    const previews: RecurrencePreview[] = [];
    const baseDate = new Date(formData.transaction_date);
    const amount = parseFloat(formData.amount);

    for (let i = 0; i < formData.recurrence_count; i++) {
      const currentDate = new Date(baseDate);
      
      switch (formData.recurrence_type) {
        case 'mensal':
          currentDate.setMonth(baseDate.getMonth() + i);
          break;
        case 'semanal':
          currentDate.setDate(baseDate.getDate() + (i * 7));
          break;
        case 'anual':
          currentDate.setFullYear(baseDate.getFullYear() + i);
          break;
        default:
          if (i > 0) return; // Para 'unica', só uma ocorrência
      }

      previews.push({
        creation_date: new Date().toISOString().split('T')[0],
        due_date: currentDate.toISOString().split('T')[0],
        description: i === 0 ? 'Nova transação' : 'Nova transação',
        amount: amount
      });
    }

    setRecurrencePreview(previews);
  };

  // Funções de controle de menu
  const handleNewTransactionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNewTransactionMenuAnchorEl(event.currentTarget);
  };

  const handleNewTransactionMenuClose = () => {
    setNewTransactionMenuAnchorEl(null);
  };

  // Funções de controle de diálogo
  const handleOpenNewTransaction = (type: 'Despesa' | 'Receita' | 'Investimento') => {
    setNewTransactionType(type);
    setFormData({
      description: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      category_id: '',
      subcategory_id: '',
      payment_status_id: '',
      contact_id: '',
      cost_center_id: '',
      transaction_type: type,
      is_recurring: false,
      recurrence_type: 'mensal',
      recurrence_count: 1,
      is_paid: false
    });
    setEditingTransaction(null);
    setRecurrencePreview([]);
    setOpen(true);
    handleNewTransactionMenuClose();
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      transaction_date: transaction.transaction_date.split('T')[0],
      category_id: transaction.category_id?.toString() || '',
      subcategory_id: transaction.subcategory_id?.toString() || '',
      payment_status_id: transaction.payment_status_id?.toString() || '',
      contact_id: transaction.contact_id?.toString() || '',
      cost_center_id: transaction.cost_center_id?.toString() || '',
      transaction_type: transaction.transaction_type,
      is_recurring: transaction.is_recurring || false,
      recurrence_type: transaction.recurrence_type || 'mensal',
      recurrence_count: transaction.recurrence_count || 1,
      is_paid: transaction.is_paid || false
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTransaction(null);
    setRecurrencePreview([]);
  };

  // Função para calcular totais
  const calculateTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const totals = {
      totalDespesas: 0,
      totalReceitas: 0,
      totalInvestimentos: 0,
      totalVencidos: 0,
      totalVencemHoje: 0,
      totalAVencer: 0,
      totalPagos: 0,
      saldoPeriodo: 0
    };

    transactions.forEach(transaction => {
      const valor = transaction.amount;
      const isPago = transaction.is_paid || transaction.payment_status_name?.toLowerCase().includes('pago');

      // Totais por tipo
      if (transaction.transaction_type === 'Despesa') {
        totals.totalDespesas += valor;
      } else if (transaction.transaction_type === 'Receita') {
        totals.totalReceitas += valor;
      } else if (transaction.transaction_type === 'Investimento') {
        totals.totalInvestimentos += valor;
      }

      // Totais por status/vencimento
      if (isPago) {
        totals.totalPagos += valor;
      } else {
        if (transaction.transaction_date < today) {
          totals.totalVencidos += valor;
        } else if (transaction.transaction_date === today) {
          totals.totalVencemHoje += valor;
        } else {
          totals.totalAVencer += valor;
        }
      }
    });

    totals.saldoPeriodo = totals.totalReceitas - totals.totalDespesas - totals.totalInvestimentos;
    return totals;
  };

  // Função de submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const transactionData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined,
        payment_status_id: formData.payment_status_id ? parseInt(formData.payment_status_id) : undefined,
        contact_id: formData.contact_id ? parseInt(formData.contact_id) : undefined,
        cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : undefined,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.recurrence_type,
        recurrence_count: formData.recurrence_count,
        is_paid: formData.is_paid
      };

      if (editingTransaction && editingTransaction.id) {
        await api.put(`/transactions/${editingTransaction.id}`, transactionData);
        showSnackbar('Transação atualizada com sucesso!', 'success');
      } else {
        await api.post('/transactions', transactionData);
        showSnackbar('Transação criada com sucesso!', 'success');
      }

      handleClose();
      loadTransactions();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      showSnackbar('Erro ao salvar transação', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar transação
  const handleDeleteTransaction = async (id: number | undefined) => {
    if (!id) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await api.delete(`/transactions/${id}`);
        showSnackbar('Transação excluída com sucesso!', 'success');
        loadTransactions();
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        showSnackbar('Erro ao excluir transação', 'error');
      }
    }
  };

  // Função para duplicar transação
  const handleDuplicateTransaction = (transaction: Transaction) => {
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      transaction_date: new Date().toISOString().split('T')[0],
      category_id: transaction.category_id?.toString() || '',
      subcategory_id: transaction.subcategory_id?.toString() || '',
      payment_status_id: transaction.payment_status_id?.toString() || '',
      contact_id: transaction.contact_id?.toString() || '',
      cost_center_id: transaction.cost_center_id?.toString() || '',
      transaction_type: transaction.transaction_type,
      is_recurring: false,
      recurrence_type: 'mensal',
      recurrence_count: 1,
      is_paid: false
    });
    setEditingTransaction(null);
    setOpen(true);
  };

  // Funções de controle de filtros
  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      month: new Date().toISOString().slice(0, 7),
      category_id: '',
      subcategory_id: '',
      payment_status_id: '',
      contact_id: '',
      cost_center_id: '',
      transaction_type: '',
      only_pending: false
    });
  };

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const totals = calculateTotals();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#EBF5FE' }}>
      <Box sx={{ p: 3 }}>
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a365d' }}>
            Controle Mensal
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleNewTransactionMenuOpen}
              startIcon={<AddIcon />}
              endIcon={<ArrowDropDownIcon />}
            >
              Novo registro
            </Button>
            <Menu
              anchorEl={newTransactionMenuAnchorEl}
              open={Boolean(newTransactionMenuAnchorEl)}
              onClose={handleNewTransactionMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleOpenNewTransaction('Despesa')}>
                <ListItemIcon>
                  <ExpenseIcon sx={{ color: '#f44336' }} />
                </ListItemIcon>
                <ListItemText>Despesa</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOpenNewTransaction('Receita')}>
                <ListItemIcon>
                  <IncomeIcon sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText>Receita</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOpenNewTransaction('Investimento')}>
                <ListItemIcon>
                  <InvestmentIcon sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText>Investimento</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1a365d' }}>
            Filtros
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(5, 1fr)'
            },
            gap: 2
          }}>
            <Box>
              <TextField
                label="Mês"
                type="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
            <Box>
              <FormControl size="small" fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  label="Categoria"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.payment_status_id}
                  onChange={(e) => handleFilterChange('payment_status_id', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {paymentStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.transaction_type}
                  onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Despesa">Despesa</MenuItem>
                  <MenuItem value="Receita">Receita</MenuItem>
                  <MenuItem value="Investimento">Investimento</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                fullWidth
                sx={{ height: '40px' }}
              >
                Limpar
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)'
          },
          gap: 3,
          mb: 3
        }}>
          <Box>
            <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                  Despesas
                </Typography>
                <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'normal', fontSize: '1rem' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalDespesas)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                  Receitas
                </Typography>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'normal', fontSize: '1rem' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalReceitas)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                  Investimentos
                </Typography>
                <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'normal', fontSize: '1rem' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalInvestimentos)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)'
          },
          gap: 2,
          mb: 3
        }}>
          <Box>
            <Card sx={{ 
              bgcolor: '#ffebee', 
              borderRadius: 2,
              border: '2px solid #f44336'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  Vencidos
                </Typography>
                <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalVencidos)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ 
              bgcolor: '#fff3e0', 
              borderRadius: 2,
              border: '2px solid #ff9800'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                  Vencem Hoje
                </Typography>
                <Typography variant="h5" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalVencemHoje)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ 
              bgcolor: '#e3f2fd', 
              borderRadius: 2,
              border: '2px solid #2196f3'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  A Vencer
                </Typography>
                <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalAVencer)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ 
              bgcolor: '#e8f5e8', 
              borderRadius: 2,
              border: '2px solid #4caf50'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                  Pagos
                </Typography>
                <Typography variant="h5" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalPagos)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ 
              bgcolor: totals.saldoPeriodo >= 0 ? '#e8f5e8' : '#ffebee', 
              borderRadius: 2,
              border: `2px solid ${totals.saldoPeriodo >= 0 ? '#4caf50' : '#f44336'}`
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ 
                  color: totals.saldoPeriodo >= 0 ? '#388e3c' : '#d32f2f', 
                  fontWeight: 'bold' 
                }}>
                  Saldo do Período
                </Typography>
                <Typography variant="h5" sx={{ 
                  color: totals.saldoPeriodo >= 0 ? '#388e3c' : '#d32f2f', 
                  fontWeight: 'bold' 
                }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.saldoPeriodo)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Tabela de transações */}
        <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Venc.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Total (R$)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        {(() => {
                          if (transaction.transaction_date.includes('T')) {
                            return new Date(transaction.transaction_date).toLocaleDateString('pt-BR');
                          } else {
                            // Usar formato UTC para evitar problemas de fuso horário
                            return new Date(transaction.transaction_date + 'T00:00:00Z').toLocaleDateString('pt-BR');
                          }
                        })()}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: transaction.transaction_type === 'Despesa' ? '#f44336' : 
                                   transaction.transaction_type === 'Receita' ? '#4caf50' : '#2196f3',
                            fontWeight: 'bold'
                          }}
                        >
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.category_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.payment_status_name || (transaction.is_paid ? 'Pago' : 'Pendente')}
                          size="small"
                          sx={{
                            bgcolor: (transaction.is_paid || transaction.payment_status_name?.toLowerCase().includes('pago')) ? '#e8f5e8' : '#ffebee',
                            color: (transaction.is_paid || transaction.payment_status_name?.toLowerCase().includes('pago')) ? '#388e3c' : '#d32f2f'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditTransaction(transaction)}
                          sx={{ color: '#1976d2' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDuplicateTransaction(transaction)}
                          sx={{ color: '#ed6c02' }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          sx={{ color: '#d32f2f' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={transactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Registros por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Paper>
      </Box>

      {/* Dialog para criar/editar transação */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ bgcolor: '#f8fafc', fontWeight: 'bold', color: '#1a365d' }}>
            Nova Transação
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, 1fr)'
              },
              gap: 3,
              mt: 1
            }}>
              {/* Primeira linha */}
              <Box>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Registro</InputLabel>
                  <Select
                    value={formData.transaction_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as any }))}
                    label="Tipo de Registro"
                    startAdornment={
                      <ExpenseIcon sx={{ 
                        color: formData.transaction_type === 'Despesa' ? '#f44336' : 
                               formData.transaction_type === 'Receita' ? '#4caf50' : '#2196f3',
                        mr: 1 
                      }} />
                    }
                  >
                    <MenuItem value="Despesa">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ExpenseIcon sx={{ color: '#f44336', mr: 1 }} />
                        Despesa
                      </Box>
                    </MenuItem>
                    <MenuItem value="Receita">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IncomeIcon sx={{ color: '#4caf50', mr: 1 }} />
                        Receita
                      </Box>
                    </MenuItem>
                    <MenuItem value="Investimento">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InvestmentIcon sx={{ color: '#2196f3', mr: 1 }} />
                        Investimento
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <TextField
                  label="Data do Registro"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box>
                <TextField
                  label="Valor"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  fullWidth
                  required
                  inputProps={{ step: "0.01" }}
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 1 }}>R$</Box>
                  }}
                />
              </Box>

              {/* Segunda linha */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  label="Descrição da Transação"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  required
                  multiline
                  rows={2}
                />
              </Box>

              {/* Terceira linha */}
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Contato</InputLabel>
                  <Select
                    value={formData.contact_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_id: e.target.value }))}
                    label="Contato"
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    {contacts.map((contact) => (
                      <MenuItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Quarta linha */}
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    label="Categoria"
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Subcategoria</InputLabel>
                  <Select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory_id: e.target.value }))}
                    label="Subcategoria"
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    {subcategories
                      .filter(sub => !formData.category_id || sub.category_id.toString() === formData.category_id)
                      .map((subcategory) => (
                        <MenuItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Centro de Custo</InputLabel>
                  <Select
                    value={formData.cost_center_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_center_id: e.target.value }))}
                    label="Centro de Custo"
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    {costCenters.map((center) => (
                      <MenuItem key={center.id} value={center.id}>
                        {center.number ? `${center.number} - ${center.name}` : center.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Switches */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)'
                  },
                  gap: 2
                }}>
                  <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="Transação Recorrente"
                />
                  </Box>
                  <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_paid}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
                      color="success"
                    />
                  }
                  label="Pago"
                />
                  </Box>
                </Box>
              </Box>

              {/* Campos de recorrência */}
              {formData.is_recurring && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)'
                    },
                    gap: 2
                  }}>
                    <Box>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Recorrência</InputLabel>
                      <Select
                        value={formData.recurrence_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurrence_type: e.target.value as any }))}
                        label="Tipo de Recorrência"
                      >
                        <MenuItem value="mensal">Mensalmente</MenuItem>
                        <MenuItem value="semanal">Semanalmente</MenuItem>
                        <MenuItem value="anual">Anualmente</MenuItem>
                      </Select>
                    </FormControl>
                    </Box>
                    <Box>
                    <TextField
                      label="Quantidade de Vezes"
                      type="number"
                      value={formData.recurrence_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence_count: parseInt(e.target.value) || 1 }))}
                      fullWidth
                      inputProps={{ min: 1, max: 60 }}
                    />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Preview de recorrências */}
            {formData.is_recurring && recurrencePreview.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a365d' }}>
                  Recorrências previstas
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data de criação</TableCell>
                        <TableCell>Data de vencimento</TableCell>
                        <TableCell>Lançamento</TableCell>
                        <TableCell align="right">Valor (R$)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recurrencePreview.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {(() => {
                              if (item.creation_date.includes('T')) {
                                return new Date(item.creation_date).toLocaleDateString('pt-BR');
                              } else {
                                // Usar formato UTC para evitar problemas de fuso horário
                                return new Date(item.creation_date + 'T00:00:00Z').toLocaleDateString('pt-BR');
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              if (item.due_date.includes('T')) {
                                return new Date(item.due_date).toLocaleDateString('pt-BR');
                              } else {
                                // Usar formato UTC para evitar problemas de fuso horário
                                return new Date(item.due_date + 'T00:00:00Z').toLocaleDateString('pt-BR');
                              }
                            })()}
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="right">
                            {item.amount.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
