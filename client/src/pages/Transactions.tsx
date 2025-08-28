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
  Snackbar,
  Autocomplete,
  Collapse,
  CircularProgress,
  Tooltip
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
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Payment as PaymentIcon,
  MoreVert as MoreVertIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import api from '../lib/axios';
import { PaymentDialog } from '../components/PaymentDialog';
import { transactionService, PaymentData } from '../services/transactionService';

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
  recurrence_type?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual' | 'personalizada';
  recurrence_count?: number;
  recurrence_interval?: number;
  recurrence_weekday?: number; // 0-6 (domingo a sábado) para recorrência semanal
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
  source_type: string;
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
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
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
    recurrence_type: 'mensal' as 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual' | 'personalizada',
    recurrence_count: 1,
    recurrence_interval: 1, // Para recorrência personalizada (a cada X dias)
    recurrence_weekday: 1, // Segunda-feira por padrão
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

  // Estados para PaymentDialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTransactionForPayment, setSelectedTransactionForPayment] = useState<Transaction | null>(null);

  // Estados para menu de ações e seleção em lote
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [batchMenuAnchorEl, setBatchMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);

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
  }, [formData.is_recurring, formData.recurrence_type, formData.recurrence_count, formData.recurrence_interval, formData.recurrence_weekday, formData.transaction_date, formData.amount, formData.description]);

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
    // Parse da data diretamente sem problemas de timezone
    const inputDate = formData.transaction_date; // formato: YYYY-MM-DD
    const amount = parseFloat(formData.amount.toString().replace(/\./g, '').replace(',', '.')) || parseFloat(formData.amount);

    for (let i = 0; i < formData.recurrence_count; i++) {
      let resultDate = inputDate; // Primeira ocorrência sempre usa a data original
      
      if (i > 0) {
        // Para as próximas ocorrências, calcular baseado no tipo
        const [year, month, day] = inputDate.split('-').map(Number);
        let newDate = new Date(year, month - 1, day);
        
        switch (formData.recurrence_type) {
          case 'semanal':
            // Para semanal, ajustar ao dia da semana se for a primeira, depois +7 dias
            if (formData.recurrence_weekday !== undefined) {
              const targetWeekday = formData.recurrence_weekday;
              const currentWeekday = newDate.getDay();
              const daysToAdd = (targetWeekday - currentWeekday + 7) % 7;
              newDate.setDate(newDate.getDate() + daysToAdd + ((i - 1) * 7));
            } else {
              newDate.setDate(newDate.getDate() + (i * 7));
            }
            break;
          case 'mensal':
            // Capturar o dia original
            const originalDay = day;
            
            // Calcular o novo mês
            const newMonth = (month - 1 + i) % 12; // month-1 porque Date usa 0-11
            const newYear = year + Math.floor((month - 1 + i) / 12);
            
            // Verificar quantos dias tem o mês de destino
            const maxDayInTargetMonth = new Date(newYear, newMonth + 1, 0).getDate();
            
            // Se o dia original não existir no mês de destino, usar o último dia disponível
            const targetDay = originalDay > maxDayInTargetMonth ? maxDayInTargetMonth : originalDay;
            
            newDate = new Date(newYear, newMonth, targetDay);
            break;
          case 'anual':
            // Capturar o dia original
            const originalDayAnnual = day;
            const targetYear = year + i;
            
            // Verificar quantos dias tem o mês no ano de destino (principalmente para 29 de fevereiro)
            const maxDayInTargetYear = new Date(targetYear, month, 0).getDate();
            
            // Se o dia original não existir no ano de destino, usar o último dia disponível
            const targetDayAnnual = originalDayAnnual > maxDayInTargetYear ? maxDayInTargetYear : originalDayAnnual;
            
            newDate = new Date(targetYear, month - 1, targetDayAnnual);
            break;
          case 'personalizada':
            newDate.setDate(newDate.getDate() + (i * (formData.recurrence_interval || 1)));
            break;
        }
        
        // Formatar de volta para YYYY-MM-DD
        resultDate = newDate.getFullYear() + '-' + 
                    String(newDate.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(newDate.getDate()).padStart(2, '0');
      }

      previews.push({
        creation_date: resultDate,
        due_date: resultDate,
        description: formData.description || 'Nova transação',
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
      recurrence_interval: 1,
      recurrence_weekday: 1,
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
      recurrence_interval: 1,
      recurrence_weekday: transaction.recurrence_weekday || 1,
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
      
      // Função para converter formato brasileiro para número
      const parseBrazilianNumber = (str: string): number => {
        if (typeof str === 'number') return str;
        
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
      
      const transactionData = {
        description: formData.description,
        amount: parseBrazilianNumber(formData.amount),
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
        recurrence_interval: formData.recurrence_interval,
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
      recurrence_interval: 1,
      recurrence_weekday: 1,
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

  // Funções para PaymentDialog
  const handleOpenPaymentDialog = (transaction: Transaction) => {
    setSelectedTransactionForPayment(transaction);
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedTransactionForPayment(null);
    setIsBatchMode(false);
  };

  const handleConfirmPayment = async (paymentData: PaymentData) => {
    try {
      if (isBatchMode) {
        // Processar pagamento em lote
        const batchPromises = selectedTransactions.map(async (transactionId) => {
          const transaction = transactions.find(t => t.id === transactionId);
          if (transaction) {
            // Para modo lote, usar o valor original de cada transação
            const batchPaymentData = {
              ...paymentData,
              paid_amount: transaction.amount // Usar valor original
            };
            await transactionService.markAsPaid(transactionId, batchPaymentData);
          }
        });
        
        await Promise.all(batchPromises);
        showSnackbar(`${selectedTransactions.length} transações marcadas como pagas com sucesso!`, 'success');
        setSelectedTransactions([]); // Limpar seleção
      } else if (selectedTransactionForPayment?.id) {
        // Processar pagamento individual
        await transactionService.markAsPaid(selectedTransactionForPayment.id, paymentData);
        showSnackbar('Transação marcada como paga com sucesso!', 'success');
      }
      
      loadTransactions(); // Recarregar a lista
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      showSnackbar('Erro ao processar pagamento', 'error');
      throw error; // Re-throw para o PaymentDialog lidar com o erro
    }
  };

  // Funções para menu de ações
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, transactionId: number) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedTransactionId(null);
  };

  // Funções para seleção em lote
  const handleSelectTransaction = (transactionId: number) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAllTransactions = () => {
    setSelectedTransactions(
      selectedTransactions.length === transactions.length 
        ? [] 
        : transactions.map(t => t.id!).filter(Boolean)
    );
  };

  const handleBatchMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBatchMenuAnchorEl(event.currentTarget);
  };

  const handleBatchMenuClose = () => {
    setBatchMenuAnchorEl(null);
  };

  // Ações do menu
  const handleMarkAsPaidFromMenu = () => {
    const transaction = transactions.find(t => t.id === selectedTransactionId);
    if (transaction) {
      handleOpenPaymentDialog(transaction);
    }
    handleActionMenuClose();
  };

  const handleBatchMarkAsPaid = () => {
    if (selectedTransactions.length === 0) {
      showSnackbar('Nenhuma transação selecionada', 'warning');
      return;
    }
    
    setIsBatchMode(true);
    // Para modo lote, criar um objeto transaction fictício para abrir o dialog
    setSelectedTransactionForPayment({ 
      id: 0, // Indica modo lote
      description: `Pagamento em lote (${selectedTransactions.length} transações)`,
      amount: 0, // Será calculado individualmente
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'Despesa',
      is_recurring: false
    });
    setPaymentDialogOpen(true);
    handleBatchMenuClose();
  };

  const handleReversePayment = async () => {
    if (!selectedTransactionId) return;
    
    if (window.confirm('Tem certeza que deseja estornar este pagamento?')) {
      try {
        await api.post(`/transactions/${selectedTransactionId}/reverse-payment`);
        showSnackbar('Pagamento estornado com sucesso!', 'success');
        loadTransactions();
      } catch (error) {
        console.error('Erro ao estornar pagamento:', error);
        showSnackbar('Erro ao estornar pagamento', 'error');
      }
    }
    handleActionMenuClose();
  };

  const totals = calculateTotals();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#EBF5FE' }}>
      <Box sx={{ p: 2 }}>
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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

        {/* Filtros Simplificados */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d' }}>
              Filtros
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              sx={{ 
                color: '#1976d2'
              }}
            >
              {showMoreFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          {/* Filtros Principais (sempre visíveis) */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
              <TextField
                label="Mês"
                type="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
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
          </Box>

          {/* Filtros Avançados (colapsáveis) */}
          <Collapse in={showMoreFilters}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
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
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
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
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                    fullWidth
                    sx={{ 
                      height: '40px',
                      borderColor: '#e0e7ff',
                      color: '#6b7280',
                      '&:hover': {
                        bgcolor: '#f3f4f6',
                        borderColor: '#3b82f6',
                      }
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Paper>

        {/* Totalizadores */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {/* Totalizadores principais mais discretos */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
            <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
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
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
            <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
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
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
            <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
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

        {/* Totalizadores de status mais visíveis */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ flex: { xs: '1 1 45%', md: '1 1 18%' } }}>
            <Card sx={{ 
              bgcolor: '#ffebee', 
              borderRadius: 2,
              border: '2px solid #f44336'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body1" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  Vencidos
                </Typography>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalVencidos)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: '1 1 45%', md: '1 1 18%' } }}>
            <Card sx={{ 
              bgcolor: '#fff3e0', 
              borderRadius: 2,
              border: '2px solid #ff9800'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body1" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                  Vencem Hoje
                </Typography>
                <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalVencemHoje)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: '1 1 45%', md: '1 1 18%' } }}>
            <Card sx={{ 
              bgcolor: '#e3f2fd', 
              borderRadius: 2,
              border: '2px solid #2196f3'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  A Vencer
                </Typography>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalAVencer)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: '1 1 45%', md: '1 1 18%' } }}>
            <Card sx={{ 
              bgcolor: '#e8f5e8', 
              borderRadius: 2,
              border: '2px solid #4caf50'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body1" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                  Pagos
                </Typography>
                <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totals.totalPagos)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 18%' } }}>
            <Card sx={{ 
              bgcolor: totals.saldoPeriodo >= 0 ? '#e8f5e8' : '#ffebee', 
              borderRadius: 2,
              border: `2px solid ${totals.saldoPeriodo >= 0 ? '#4caf50' : '#f44336'}`
            }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body1" sx={{ 
                  color: totals.saldoPeriodo >= 0 ? '#388e3c' : '#d32f2f', 
                  fontWeight: 'bold' 
                }}>
                  Saldo do Período
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: totals.saldoPeriodo >= 0 ? '#388e3c' : '#d32f2f', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
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
          {/* Barra de ações em lote */}
          {selectedTransactions.length > 0 && (
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {selectedTransactions.length} registro(s) selecionado(s)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleBatchMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                >
                  Ações em lote
                </Button>
                <Menu
                  anchorEl={batchMenuAnchorEl}
                  open={Boolean(batchMenuAnchorEl)}
                  onClose={handleBatchMenuClose}
                >
                  <MenuItem onClick={handleBatchMarkAsPaid}>
                    <ListItemIcon>
                      <PaymentIcon sx={{ color: '#4caf50' }} />
                    </ListItemIcon>
                    <ListItemText>Marcar como Pago</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => setSelectedTransactions([])}>
                    <ListItemIcon>
                      <ClearIcon />
                    </ListItemIcon>
                    <ListItemText>Excluir Selecionados</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          )}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d', width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                      onChange={handleSelectAllTransactions}
                      style={{
                        transform: 'scale(1.2)',
                        accentColor: '#1976d2'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Venc.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Total (R$)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Situação</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => {
                    const isPaid = transaction.is_paid || transaction.payment_status_name?.toLowerCase().includes('pago');
                    return (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id!)}
                          onChange={() => handleSelectTransaction(transaction.id!)}
                          style={{
                            transform: 'scale(1.2)',
                            accentColor: '#1976d2'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {transaction.description}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {transaction.contact_name && (
                              <Chip 
                                label={transaction.contact_name} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  height: '20px', 
                                  fontSize: '0.7rem',
                                  bgcolor: '#e3f2fd',
                                  borderColor: '#1976d2',
                                  color: '#1976d2'
                                }} 
                              />
                            )}
                            {transaction.category_name && (
                              <Chip 
                                label={transaction.category_name} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  height: '20px', 
                                  fontSize: '0.7rem',
                                  bgcolor: '#f3e5f5',
                                  borderColor: '#9c27b0',
                                  color: '#9c27b0'
                                }} 
                              />
                            )}
                            {transaction.subcategory_name && (
                              <Chip 
                                label={transaction.subcategory_name} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  height: '20px', 
                                  fontSize: '0.7rem',
                                  bgcolor: '#e8f5e8',
                                  borderColor: '#4caf50',
                                  color: '#4caf50'
                                }} 
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
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
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            transaction.is_paid ? 'Pago' : 
                            transaction.payment_status_name?.toLowerCase().includes('pago') ? 'Pago' :
                            'Em aberto'
                          }
                          size="small"
                          sx={{
                            bgcolor: (transaction.is_paid || transaction.payment_status_name?.toLowerCase().includes('pago')) ? '#e8f5e8' : '#fff3e0',
                            color: (transaction.is_paid || transaction.payment_status_name?.toLowerCase().includes('pago')) ? '#388e3c' : '#f57c00',
                            border: (transaction.is_paid || transaction.payment_status_name?.toLowerCase().includes('pago')) ? '1px solid #4caf50' : '1px solid #ff9800'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, transaction.id!)}
                          sx={{ color: '#666' }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                        
                        <Menu
                          anchorEl={actionMenuAnchorEl}
                          open={Boolean(actionMenuAnchorEl) && selectedTransactionId === transaction.id}
                          onClose={handleActionMenuClose}
                        >
                          <MenuItem 
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <ListItemIcon>
                              <EditIcon sx={{ color: '#1976d2' }} />
                            </ListItemIcon>
                            <ListItemText>Editar</ListItemText>
                          </MenuItem>
                          
                          <MenuItem 
                            onClick={() => handleDuplicateTransaction(transaction)}
                          >
                            <ListItemIcon>
                              <ContentCopyIcon sx={{ color: '#ed6c02' }} />
                            </ListItemIcon>
                            <ListItemText>Duplicar</ListItemText>
                          </MenuItem>
                          
                          <MenuItem 
                            onClick={handleMarkAsPaidFromMenu}
                            disabled={isPaid}
                            sx={{
                              opacity: isPaid ? 0.5 : 1,
                              pointerEvents: isPaid ? 'none' : 'auto'
                            }}
                          >
                            <ListItemIcon>
                              <PaymentIcon sx={{ color: isPaid ? '#ccc' : '#4caf50' }} />
                            </ListItemIcon>
                            <ListItemText>Marcar como Pago</ListItemText>
                          </MenuItem>
                          
                          <MenuItem 
                            onClick={handleReversePayment}
                            disabled={!isPaid}
                            sx={{
                              opacity: !isPaid ? 0.5 : 1,
                              pointerEvents: !isPaid ? 'none' : 'auto'
                            }}
                          >
                            <ListItemIcon>
                              <UndoIcon sx={{ color: !isPaid ? '#ccc' : '#ff9800' }} />
                            </ListItemIcon>
                            <ListItemText>Estornar</ListItemText>
                          </MenuItem>
                          
                          <MenuItem 
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <ListItemIcon>
                              <DeleteIcon sx={{ color: '#d32f2f' }} />
                            </ListItemIcon>
                            <ListItemText>Excluir</ListItemText>
                          </MenuItem>
                        </Menu>
                      </TableCell>
                    </TableRow>
                  );
                  })}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
              {/* Primeira linha - 3 colunas como na imagem */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Tipo de Registro</InputLabel>
                    <Select
                      value={formData.transaction_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as any }))}
                      label="Tipo de Registro"
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
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <TextField
                    label="Data do Registro"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                    fullWidth
                    required
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <TextField
                    label="Valor"
                    type="text"
                    value={formData.amount}
                    placeholder="0,00"
                    onChange={(e) => {
                      // Permite apenas números, vírgula e ponto
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      setFormData(prev => ({ ...prev, amount: value }));
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
                          setFormData(prev => ({ ...prev, amount: formattedValue }));
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
                          setFormData(prev => ({ ...prev, amount: editableValue }));
                        }
                      }
                    }}
                    fullWidth
                    required
                    size="small"
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>
                    }}
                    helperText="Use vírgula para decimais (ex: 1666,00)"
                  />
                </Box>
              </Box>

              {/* Segunda linha - Descrição */}
              <Box>
                <TextField
                  label="Descrição da Transação"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  required
                  size="small"
                />
              </Box>

              {/* Terceira linha - Contato */}
              <Box>
                <Autocomplete
                  options={contacts}
                  getOptionLabel={(option) => option.name}
                  value={contacts.find(contact => contact.id.toString() === formData.contact_id) || null}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, contact_id: newValue ? newValue.id.toString() : '' }));
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Contato" 
                      size="small"
                      placeholder="Digite para pesquisar..."
                    />
                  )}
                  noOptionsText="Nenhum contato encontrado"
                />
              </Box>

              {/* Quarta linha - 3 colunas */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <Autocomplete
                    options={categories.filter(category => 
                      !formData.transaction_type || category.source_type === formData.transaction_type
                    )}
                    getOptionLabel={(option) => option.name}
                    value={categories.find(category => category.id.toString() === formData.category_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        category_id: newValue ? newValue.id.toString() : '',
                        subcategory_id: '' // Reset subcategory when category changes
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Categoria" 
                        size="small"
                        placeholder="Digite para pesquisar..."
                      />
                    )}
                    noOptionsText="Nenhuma categoria encontrada"
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <Autocomplete
                    options={subcategories.filter(sub => !formData.category_id || sub.category_id.toString() === formData.category_id)}
                    getOptionLabel={(option) => option.name}
                    value={subcategories.find(sub => sub.id.toString() === formData.subcategory_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, subcategory_id: newValue ? newValue.id.toString() : '' }));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Subcategoria" 
                        size="small"
                        placeholder="Digite para pesquisar..."
                      />
                    )}
                    noOptionsText="Nenhuma subcategoria encontrada"
                    disabled={!formData.category_id}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                  <Autocomplete
                    options={costCenters}
                    getOptionLabel={(option) => option.number ? `${option.number} - ${option.name}` : option.name}
                    value={costCenters.find(center => center.id.toString() === formData.cost_center_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, cost_center_id: newValue ? newValue.id.toString() : '' }));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Centro de Custo" 
                        size="small"
                        placeholder="Digite para pesquisar..."
                      />
                    )}
                    noOptionsText="Nenhum centro de custo encontrado"
                  />
                </Box>
              </Box>

              {/* Switches lado a lado como na imagem */}
              <Box>
                <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
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

              {/* Campos de recorrência */}
              {formData.is_recurring && (
                <>
                  {/* Todos os campos de recorrência na mesma linha */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tipo de Recorrência</InputLabel>
                        <Select
                          value={formData.recurrence_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurrence_type: e.target.value as any }))}
                          label="Tipo de Recorrência"
                        >
                          <MenuItem value="semanal">Semanalmente</MenuItem>
                          <MenuItem value="mensal">Mensalmente</MenuItem>
                          <MenuItem value="anual">Anualmente</MenuItem>
                          <MenuItem value="personalizada">A cada X dias</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    
                    {/* Dia da Semana para Recorrência Semanal */}
                    {formData.recurrence_type === 'semanal' && (
                      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Dia da Semana</InputLabel>
                          <Select
                            value={formData.recurrence_weekday}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurrence_weekday: parseInt(e.target.value as unknown as string) }))}
                            label="Dia da Semana"
                          >
                            <MenuItem value={1}>Segunda-feira</MenuItem>
                            <MenuItem value={2}>Terça-feira</MenuItem>
                            <MenuItem value={3}>Quarta-feira</MenuItem>
                            <MenuItem value={4}>Quinta-feira</MenuItem>
                            <MenuItem value={5}>Sexta-feira</MenuItem>
                            <MenuItem value={6}>Sábado</MenuItem>
                            <MenuItem value={0}>Domingo</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                    
                    {/* Intervalo para Recorrência Personalizada */}
                    {formData.recurrence_type === 'personalizada' && (
                      <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                        <TextField
                          label="A cada quantos dias"
                          type="number"
                          value={formData.recurrence_interval || 1}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: parseInt(e.target.value) || 1 }))}
                          fullWidth
                          size="small"
                          inputProps={{ min: 1, max: 365 }}
                        />
                      </Box>
                    )}
                    
                    {/* Quantidade de Vezes sempre visível */}
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%' } }}>
                      <TextField
                        label="Quantidade de Vezes"
                        type="number"
                        value={formData.recurrence_count || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Permite que o campo fique vazio
                          setFormData(prev => ({ 
                            ...prev, 
                            recurrence_count: value === '' ? '' as any : parseInt(value) || 1 
                          }));
                        }}
                        onBlur={(e) => {
                          // Se estiver vazio ao perder o foco, preencher com 1
                          if (e.target.value === '' || parseInt(e.target.value) <= 0) {
                            setFormData(prev => ({ ...prev, recurrence_count: 1 }));
                          }
                        }}
                        fullWidth
                        size="small"
                        inputProps={{ min: 1, max: 60 }}
                      />
                    </Box>
                  </Box>
                </>
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
                          <TableCell>{item.creation_date.split('-').reverse().join('/')}</TableCell>
                          <TableCell>{item.due_date.split('-').reverse().join('/')}</TableCell>
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

      {/* PaymentDialog para marcar como pago */}
      <PaymentDialog 
        open={paymentDialogOpen}
        transaction={selectedTransactionForPayment}
        onClose={handleClosePaymentDialog}
        onConfirm={handleConfirmPayment}
        isBatchMode={isBatchMode}
        selectedTransactionIds={selectedTransactions}
      />
    </Box>
  );
}
