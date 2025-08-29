import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Autocomplete,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Paid as PaidIcon,
  Undo as UndoIcon,
  Remove as RemoveIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as ExpenseIcon,
  TrendingUp as IncomeIcon,
  TrendingDown,
  TrendingUp,
  ShowChart as InvestmentIcon,
  ShowChart,
  FilterList as FilterIcon,
  AutoFixHigh as ClearIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, addMonths, subMonths } from 'date-fns';
import api from '../services/api';
import { transactionService, PaymentData, Transaction as ServiceTransaction } from '../services/transactionService';
import PaymentDialog from '../components/PaymentDialog';
import axios from 'axios';
import { ModernHeader, ModernSection, ModernCard, ModernStatsCard } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  transaction_type: 'Despesa' | 'Receita' | 'Investimento';
  is_paid: boolean;
  is_recurring?: boolean;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  contact?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
  cost_center?: {
    id: number;
    name: string;
    number?: string;
  };
  // Campos originais para edição
  original_cost_center_id?: number;
  original_contact_id?: number;
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

interface Contact {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  name: string;
  number?: string;
}

interface PaymentStatus {
  id: number;
  name: string;
}

interface Filters {
  transaction_type: string[];
  payment_status_id: string[];
  category_id: string[];
  subcategory_id: string;
  contact_id: string[];
  cost_center_id: string[];
}

export default function MonthlyControl() {
  // Responsividade
  const theme = useTheme();
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  
  // Estados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Estados para filtros avançados de data
  const [dateFilterType, setDateFilterType] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estados para filtros
  const [filters, setFilters] = useState<Filters>({
    transaction_type: [],
    payment_status_id: [], // Mostrando todas as transações por padrão
    category_id: [],
    subcategory_id: '',
    contact_id: [],
    cost_center_id: []
  });
  
  // Estados para ordenação
  const [orderBy, setOrderBy] = useState<string>('transaction_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estados para dados dos filtros
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  
  // Estados para seleção e ações
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [newTransactionMenuAnchor, setNewTransactionMenuAnchor] = useState<HTMLElement | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState<boolean>(false);
  const [batchActionsAnchor, setBatchActionsAnchor] = useState<HTMLElement | null>(null);

  // Estados para modal de criação/edição de transação
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    category_id: '',
    subcategory_id: '',
    payment_status_id: '',
    contact_id: '',
    cost_center_id: '',
    transaction_type: 'Despesa' as 'Despesa' | 'Receita' | 'Investimento',
    is_recurring: false,
    recurrence_type: 'mensal' as 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual' | 'personalizada',
    recurrence_count: 1 as number | string,
    recurrence_interval: 1,
    recurrence_weekday: 1,
    is_paid: false,
    is_installment: false,
    total_installments: 1 as number | string
  });

  // Estado para preview de recorrências
  const [recurrencePreview, setRecurrencePreview] = useState<Array<{
    creation_date: string;
    due_date: string;
    description: string;
    amount: number;
  }>>([]);

  // Estados de notificação
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Estados para PaymentDialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTransactionForPayment, setSelectedTransactionForPayment] = useState<ServiceTransaction | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Estados para edição em lote
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [batchEditData, setBatchEditData] = useState({
    amount: '',
    description: '',
    transaction_date: '',
    contact_id: '',
    category_id: '',
    subcategory_id: '',
    cost_center_id: ''
  });

  // Cálculo dos totais e status de vencimento
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const totalReceitas = transactions
    .filter(t => t.transaction_type === 'Receita')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalDespesas = transactions
    .filter(t => t.transaction_type === 'Despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  // Cálculos dos totalizadores
  const vencidos = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return !t.is_paid && transactionDate < today;
  });

  const vencemHoje = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return !t.is_paid && transactionDate.getTime() === today.getTime();
  });

  const aVencer = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return !t.is_paid && transactionDate > today;
  });

  const totalVencidos = vencidos.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -t.amount : t.amount), 0);
  const totalVencemHoje = vencemHoje.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -t.amount : t.amount), 0);
  const totalAVencer = aVencer.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -t.amount : t.amount), 0);
  const saldoPeriodo = totalReceitas - totalDespesas;

  // Carregar dados iniciais
  useEffect(() => {
    console.log("useEffect para carregar dados foi acionado. Dependências:", {
      currentDate,
      filters,
      dateFilterType,
      customStartDate,
      customEndDate,
      selectedYear,
    });
    loadTransactions();
    loadFilterData();
  }, [currentDate, filters, dateFilterType, customStartDate, customEndDate, selectedYear]);

  // Atualizar preview de recorrências quando dados do formulário mudam
  useEffect(() => {
    if (formData.is_recurring && formData.transaction_date && formData.amount) {
      generateRecurrencePreview();
    } else {
      setRecurrencePreview([]);
    }
  }, [formData.is_recurring, formData.recurrence_type, formData.recurrence_count, formData.recurrence_interval, formData.recurrence_weekday, formData.transaction_date, formData.amount, formData.description]);

  // Função para gerar preview de recorrências
  const generateRecurrencePreview = () => {
    const count = typeof formData.recurrence_count === 'string' ? parseInt(formData.recurrence_count) || 0 : formData.recurrence_count;
    
    if (!formData.transaction_date || !formData.amount || count < 1) {
      setRecurrencePreview([]);
      return;
    }

    const previews: Array<{
      creation_date: string;
      due_date: string;
      description: string;
      amount: number;
    }> = [];
    
    const amount = parseFloat(formData.amount.toString().replace(/\./g, '').replace(',', '.')) || parseFloat(formData.amount);

    // Função para adicionar meses sem usar Date
    const addMonths = (dateStr: string, months: number): string => {
      const [year, month, day] = dateStr.split('-').map(Number);
      let newYear = year;
      let newMonth = month + months;
      
      while (newMonth > 12) {
        newMonth -= 12;
        newYear += 1;
      }
      
      // Verificar se o dia existe no novo mês
      const daysInMonth = new Date(newYear, newMonth, 0).getDate();
      const newDay = Math.min(day, daysInMonth);
      
      return newYear + '-' + String(newMonth).padStart(2, '0') + '-' + String(newDay).padStart(2, '0');
    };

    // Função para adicionar dias sem usar Date
    const addDays = (dateStr: string, days: number): string => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day + days);
      return date.getFullYear() + '-' + 
             String(date.getMonth() + 1).padStart(2, '0') + '-' + 
             String(date.getDate()).padStart(2, '0');
    };

    for (let i = 0; i < count; i++) {
      let resultDate: string | undefined;
      if (i === 0) {
        resultDate = formData.transaction_date;
      } else {
        switch (formData.recurrence_type) {
          case 'semanal':
            if (i === 1) {
              // SEGUNDA OCORRÊNCIA: Calcular próxima ocorrência do dia da semana selecionado
              const [year, month, day] = formData.transaction_date.split('-').map(Number);
              const baseDate = new Date(year, month - 1, day);
              const currentDayOfWeek = baseDate.getDay(); // 0=domingo, 1=segunda, etc.
              const targetDayOfWeek = formData.recurrence_weekday; // 0=domingo, 1=segunda, etc.
              
              // Calcular quantos dias até o próximo dia alvo
              let daysUntilTarget = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
              if (daysUntilTarget === 0) daysUntilTarget = 7; // Se for o mesmo dia, vai para a próxima semana
              
              const nextDate = new Date(year, month - 1, day + daysUntilTarget);
              resultDate = nextDate.getFullYear() + '-' + 
                          String(nextDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(nextDate.getDate()).padStart(2, '0');
            } else if (i > 1) {
              // TERCEIRA OCORRÊNCIA EM DIANTE: Adicionar 7 dias à segunda ocorrência
              const [year, month, day] = formData.transaction_date.split('-').map(Number);
              const baseDate = new Date(year, month - 1, day);
              const currentDayOfWeek = baseDate.getDay();
              const targetDayOfWeek = formData.recurrence_weekday;
              
              let daysUntilTarget = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
              if (daysUntilTarget === 0) daysUntilTarget = 7;
              
              // Adicionar semanas adicionais
              const totalDays = daysUntilTarget + (7 * (i - 1));
              const futureDate = new Date(year, month - 1, day + totalDays);
              resultDate = futureDate.getFullYear() + '-' + 
                          String(futureDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(futureDate.getDate()).padStart(2, '0');
            }
            break;
          case 'mensal':
            resultDate = addMonths(formData.transaction_date, i);
            break;
          case 'anual':
            const [year, month, day] = formData.transaction_date.split('-');
            resultDate = (parseInt(year) + i) + '-' + month + '-' + day;
            break;
          case 'personalizada':
            resultDate = addDays(formData.transaction_date, i * (formData.recurrence_interval || 1));
            break;
          default:
            resultDate = formData.transaction_date;
        }
      }
      // Garantir valor padrão
      if (!resultDate) resultDate = formData.transaction_date;
      previews.push({
        creation_date: new Date().toISOString().split('T')[0],
        due_date: resultDate,
        description: formData.description || 'Nova transação',
        amount: amount
      });
    }

    setRecurrencePreview(previews);
  };

  const loadTransactions = async () => {
    console.log("Iniciando loadTransactions...");
    try {
      setLoading(true);
      
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      // Apenas aplicar filtros de data se não for "Todo o período"
      if (dateFilterType !== 'all') {
        if (dateFilterType === 'month') {
          startDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
          endDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
        } else if (dateFilterType === 'year') {
          startDate = `${selectedYear}-01-01`;
          endDate = `${selectedYear}-12-31`;
        } else if (dateFilterType === 'custom' && customStartDate && customEndDate) {
          startDate = format(customStartDate, 'yyyy-MM-dd');
          endDate = format(customEndDate, 'yyyy-MM-dd');
        }
      }
      
      // Preparar parâmetros de filtro
      const baseParams: any = {
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => {
          // Tratar filtros de array e payment_status_id separadamente
          if (key === 'payment_status_id' || key === 'transaction_type' || key === 'contact_id' || key === 'cost_center_id' || key === 'category_id') {
            return false; // Não incluir nos parâmetros da URL (serão aplicados no frontend)
          }
          return value !== '';
        }))
      };
      
      // Adicionar parâmetros de data apenas se não for "Todo o período"
      if (dateFilterType !== 'all' && startDate && endDate) {
        baseParams.start_date = startDate;
        baseParams.end_date = endDate;
      }
      
      const params = new URLSearchParams(baseParams);
      
      console.log('Enviando requisição para /api/transactions com os parâmetros:', params.toString());
      
      const response = await api.get(`/transactions?${params}`);
      console.log("Resposta da API recebida:", response.data);
      
      // Aplicar filtros no frontend
      let filteredTransactions = response.data;
      
      // Filtro de status de pagamento
      if (filters.payment_status_id.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => {
          if (filters.payment_status_id.includes('paid') && t.payment_status_id === 2) return true;
          if (filters.payment_status_id.includes('unpaid') && t.payment_status_id !== 2) return true;
          if (filters.payment_status_id.includes('overdue') && t.payment_status_id !== 2 && new Date(t.transaction_date) < new Date()) return true;
          if (filters.payment_status_id.includes('cancelled') && t.payment_status_id === 3) return true; // Assumindo status 3 para cancelado
          return false;
        });
      }
      
      // Filtro de tipo de transação
      if (filters.transaction_type.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => 
          filters.transaction_type.includes(t.transaction_type)
        );
      }
      
      // Filtro de contato
      if (filters.contact_id.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => 
          filters.contact_id.includes(t.contact_id?.toString() || '')
        );
      }
      
      // Filtro de centro de custo
      if (filters.cost_center_id.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => 
          filters.cost_center_id.includes(t.cost_center_id?.toString() || '')
        );
      }
      
      // Filtro de categoria
      if (filters.category_id.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => 
          filters.category_id.includes(t.category_id?.toString() || '')
        );
      }
      
      setTransactions(filteredTransactions.map((transaction: any) => ({
        ...transaction,
        // Mapear os dados relacionados para o formato esperado pelo frontend
        contact: transaction.contact_name ? { 
          id: transaction.contact_id, 
          name: transaction.contact_name 
        } : null,
        category: transaction.category_name ? { 
          id: transaction.category_id, 
          name: transaction.category_name 
        } : null,
        subcategory: transaction.subcategory_name ? { 
          id: transaction.subcategory_id, 
          name: transaction.subcategory_name 
        } : null,
        cost_center: transaction.cost_center_name ? { 
          id: transaction.cost_center_id, // Use o ID real do banco de dados
          name: transaction.cost_center_name,
          number: transaction.cost_center_number
        } : null,
        // Converter o campo is_paid baseado no payment_status_id
        is_paid: transaction.payment_status_id === 2,
        // Campos de parcelamento
        is_installment: transaction.is_installment || false,
        installment_number: transaction.installment_number || null,
        total_installments: transaction.total_installments || null,
        // Manter os IDs originais para edição
        original_cost_center_id: transaction.cost_center_id,
        original_contact_id: transaction.contact_id
      })));
    } catch (error) {
      console.error('Erro detalhado ao carregar transações:', error);
      if (axios.isAxiosError(error)) {
        console.error("Detalhes do erro Axios:", {
          message: error.message,
          config: error.config,
          response: error.response?.data,
          status: error.response?.status,
        });
      }
    } finally {
      console.log("Finalizando loadTransactions.");
      setLoading(false);
    }
  };

  const loadFilterData = async () => {
    try {
      const [categoriesRes, subcategoriesRes, contactsRes, costCentersRes, paymentStatusesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
        api.get('/contacts'),
        api.get('/cost-centers'),
        api.get('/payment-statuses')
      ]);
      
      setCategories(categoriesRes.data);
      setSubcategories(subcategoriesRes.data);
      setContacts(contactsRes.data);
      setCostCenters(costCentersRes.data);
      setPaymentStatuses(paymentStatusesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
    }
  };

  // Seleção de transações
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
        : transactions.map(t => t.id)
    );
  };

  // Menu de ações
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, transactionId: number) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedTransactionId(null);
  };

  // Ações de transação
  const handleDuplicateTransaction = async (id: number) => {
    try {
      // Buscar dados da transação original
      const response = await api.get(`/transactions/${id}`);
      const original = response.data;
      // Remover id e ajustar datas se necessário
      const duplicated = {
        ...original,
        id: undefined,
        transaction_date: new Date().toISOString().split('T')[0], // opcional: data atual
        description: original.description + ' (cópia)'
      };
      await api.post('/transactions', duplicated);
      loadTransactions();
      showSnackbar('Transação duplicada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao duplicar transação:', error);
      showSnackbar('Erro ao duplicar transação', 'error');
    }
    handleActionMenuClose();
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await api.delete(`/transactions/${id}`);
        loadTransactions();
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
      }
    }
    handleActionMenuClose();
  };

  const handleMarkAsPaid = async (id: number) => {
    // Encontrar a transação
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Abrir o PaymentDialog para coleta de informações detalhadas
    setSelectedTransactionForPayment({
      ...transaction,
      is_recurring: transaction.is_recurring || false
    });
    setIsBatchMode(false);
    setPaymentDialogOpen(true);
    handleActionMenuClose();
  };

  // Ações em lote
  const handleBatchMarkAsPaid = async () => {
    if (selectedTransactions.length === 0) return;
    
    // Abrir PaymentDialog em modo lote
    setIsBatchMode(true);
    setSelectedTransactionForPayment({
      id: 0, // Indica modo lote
      description: `Pagamento em lote (${selectedTransactions.length} transações)`,
      amount: 0, // Será calculado individualmente
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'Despesa',
      is_recurring: false
    });
    setPaymentDialogOpen(true);
    setBatchActionsAnchor(null);
  };

  const handleBatchDelete = async () => {
    if (selectedTransactions.length === 0) return;
    
    if (window.confirm(`Tem certeza que deseja excluir ${selectedTransactions.length} transação(ões) selecionada(s)?`)) {
      try {
        await Promise.all(
          selectedTransactions.map(id => 
            api.delete(`/transactions/${id}`)
          )
        );
        setSelectedTransactions([]);
        loadTransactions();
        showSnackbar(`${selectedTransactions.length} transações excluídas`);
      } catch (error) {
        console.error('Erro ao excluir transações:', error);
        showSnackbar('Erro ao excluir transações', 'error');
      }
    }
    setBatchActionsAnchor(null);
  };

  const handleBatchEdit = () => {
    if (selectedTransactions.length === 0) return;
    
    // Limpar dados do formulário de edição em lote
    setBatchEditData({
      amount: '',
      description: '',
      transaction_date: '',
      contact_id: '',
      category_id: '',
      subcategory_id: '',
      cost_center_id: ''
    });
    
    setBatchEditDialogOpen(true);
    setBatchActionsAnchor(null);
  };

  const handleConfirmBatchEdit = async () => {
    try {
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
      
      // Criar objeto com apenas os campos preenchidos
      const updateData: any = {};
      
      if (batchEditData.amount && batchEditData.amount.trim() !== '') {
        updateData.amount = parseBrazilianNumber(batchEditData.amount);
      }
      
      if (batchEditData.description && batchEditData.description.trim() !== '') {
        updateData.description = batchEditData.description;
      }
      
      if (batchEditData.transaction_date && batchEditData.transaction_date.trim() !== '') {
        updateData.transaction_date = batchEditData.transaction_date;
      }
      if (batchEditData.contact_id && batchEditData.contact_id !== '') {
        updateData.contact_id = parseInt(batchEditData.contact_id);
      }
      // Handle category - simple single selection
      if (batchEditData.category_id && batchEditData.category_id !== '') {
        updateData.category_id = parseInt(batchEditData.category_id);
      }
      // Handle subcategory - simple single selection
      if (batchEditData.subcategory_id && batchEditData.subcategory_id !== '') {
        updateData.subcategory_id = parseInt(batchEditData.subcategory_id);
      }
      if (batchEditData.cost_center_id && batchEditData.cost_center_id !== '') {
        updateData.cost_center_id = parseInt(batchEditData.cost_center_id);
      }
      
      // Debug do updateData
      
      // Se nenhum campo foi preenchido, não fazer nada
      if (Object.keys(updateData).length === 0) {
        showSnackbar('Nenhum campo foi preenchido para edição', 'warning');
        return;
      }
      
      // Atualizar todas as transações selecionadas usando PATCH
      await Promise.all(
        selectedTransactions.map(id => 
          api.patch(`/transactions/${id}`, updateData)
        )
      );
      
      setSelectedTransactions([]);
      setBatchEditDialogOpen(false);
      loadTransactions();
      showSnackbar(`${selectedTransactions.length} transações atualizadas com sucesso!`);
    } catch (error) {
      console.error('Erro ao editar transações em lote:', error);
      showSnackbar('Erro ao editar transações em lote', 'error');
    }
  };

  // Funções para PaymentDialog
  const handleConfirmPayment = async (paymentData: PaymentData) => {
    try {
      if (isBatchMode) {
        // Processar pagamento em lote
        const batchPromises = selectedTransactions.map(async (transactionId) => {
          const transaction = transactions.find(t => t.id === transactionId);
          if (transaction) {
            const batchPaymentData = {
              ...paymentData,
              paid_amount: transaction.amount // Usar valor original de cada transação
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

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedTransactionForPayment(null);
    setIsBatchMode(false);
  };

  // Função para estornar pagamento
  const handleReversePayment = async (id: number) => {
    if (window.confirm('Tem certeza que deseja estornar este pagamento? O status voltará para "Em Aberto" ou "Vencido" conforme a data.')) {
      try {
        await api.post(`/transactions/${id}/reverse-payment`);
        showSnackbar('Pagamento estornado com sucesso!', 'success');
        loadTransactions();
      } catch (error) {
        console.error('Erro ao estornar pagamento:', error);
        showSnackbar('Erro ao estornar pagamento', 'error');
      }
    }
    handleActionMenuClose();
  };

  // Função para estorno em lote
  const handleBatchReversePayment = async () => {
    if (selectedTransactions.length === 0) return;
    
    // Filtrar apenas transações que estão pagas
    const paidTransactions = transactions.filter(t => 
      selectedTransactions.includes(t.id) && t.is_paid
    );
    
    if (paidTransactions.length === 0) {
      showSnackbar('Nenhuma transação paga selecionada para estorno', 'warning');
      setBatchActionsAnchor(null);
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja estornar ${paidTransactions.length} pagamento(s)? O status voltará para "Em Aberto" ou "Vencido" conforme a data.`)) {
      try {
        await Promise.all(
          paidTransactions.map(transaction => 
            api.post(`/transactions/${transaction.id}/reverse-payment`)
          )
        );
        
        setSelectedTransactions([]);
        loadTransactions();
        showSnackbar(`${paidTransactions.length} pagamento(s) estornado(s) com sucesso!`, 'success');
      } catch (error) {
        console.error('Erro ao estornar pagamentos em lote:', error);
        showSnackbar('Erro ao estornar pagamentos em lote', 'error');
      }
    }
    setBatchActionsAnchor(null);
  };

  // Funções para modal de transação
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleNewTransaction = (type: 'Despesa' | 'Receita' | 'Investimento') => {
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
      is_paid: false,
      is_installment: false,
      total_installments: 1
    });
    setEditingTransaction(null);
    setRecurrencePreview([]);
    setTransactionDialogOpen(true);
    setNewTransactionMenuAnchor(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    
    // Formatar o valor para o padrão brasileiro (substituir ponto por vírgula)
    const formattedAmount = transaction.amount.toFixed(2).replace('.', ',');
    
    setFormData({
      description: transaction.description,
      amount: formattedAmount,
      transaction_date: transaction.transaction_date.split('T')[0],
      category_id: transaction.category?.id?.toString() || '',
      subcategory_id: transaction.subcategory?.id?.toString() || '',
      payment_status_id: '', // Não disponível na interface atual
      contact_id: (transaction as any).original_contact_id?.toString() || transaction.contact?.id?.toString() || '',
      cost_center_id: (transaction as any).original_cost_center_id?.toString() || '',
      transaction_type: transaction.transaction_type,
      is_recurring: false, // Default para edição
      recurrence_type: 'mensal',
      recurrence_count: 1,
      recurrence_interval: 1,
      recurrence_weekday: 1,
      is_paid: transaction.is_paid || false,
      is_installment: transaction.is_installment || false,
      total_installments: transaction.total_installments || 1
    });
    setRecurrencePreview([]);
    setTransactionDialogOpen(true);
    handleActionMenuClose();
  };

  const handleCloseTransactionDialog = () => {
    setTransactionDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validação de campos obrigatórios
      if (!formData.description.trim()) {
        showSnackbar('Descrição é obrigatória', 'error');
        return;
      }
      if (!formData.amount.trim()) {
        showSnackbar('Valor é obrigatório', 'error');
        return;
      }
      if (!formData.category_id) {
        showSnackbar('Categoria é obrigatória', 'error');
        return;
      }
      if (!formData.contact_id) {
        showSnackbar('Contato é obrigatório', 'error');
        return;
      }
      if (!formData.cost_center_id) {
        showSnackbar('Centro de Custo é obrigatório', 'error');
        return;
      }
      
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
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        payment_status_id: formData.payment_status_id ? parseInt(formData.payment_status_id) : null,
        contact_id: formData.contact_id ? parseInt(formData.contact_id) : null,
        cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : null,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        recurrence_count: formData.is_recurring ? formData.recurrence_count : null,
        recurrence_interval: formData.is_recurring && formData.recurrence_type === 'personalizada' ? formData.recurrence_interval : null,
        recurrence_weekday: formData.is_recurring && formData.recurrence_type === 'semanal' ? formData.recurrence_weekday : null,
        is_paid: formData.is_paid,
        is_installment: formData.is_installment,
        total_installments: formData.is_installment ? (typeof formData.total_installments === 'string' ? parseInt(formData.total_installments) || 1 : formData.total_installments) : null
      };

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, transactionData);
        showSnackbar('Transação atualizada com sucesso!');
      } else {
        await api.post('/transactions', transactionData);
        showSnackbar('Transação criada com sucesso!');
      }

      handleCloseTransactionDialog();
      loadTransactions();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      showSnackbar('Erro ao salvar transação', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com ordenação
  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Função para comparar valores na ordenação
  const descendingComparator = (a: any, b: any, orderBy: string) => {
    let aValue: any;
    let bValue: any;

    switch (orderBy) {
      case 'transaction_date':
        aValue = new Date(a.transaction_date);
        bValue = new Date(b.transaction_date);
        break;
      case 'description':
        aValue = a.description.toLowerCase();
        bValue = b.description.toLowerCase();
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'status':
        // Ordenar por: Vencido -> Em aberto -> Pago
        const getStatusOrder = (transaction: Transaction) => {
          if (transaction.is_paid) return 3; // Pago
          if (isTransactionOverdue(transaction)) return 1; // Vencido
          return 2; // Em aberto
        };
        aValue = getStatusOrder(a);
        bValue = getStatusOrder(b);
        break;
      default:
        aValue = a[orderBy];
        bValue = b[orderBy];
    }

    if (bValue < aValue) {
      return -1;
    }
    if (bValue > aValue) {
      return 1;
    }
    return 0;
  };

  const getComparator = (order: 'asc' | 'desc', orderBy: string) => {
    return order === 'desc'
      ? (a: any, b: any) => descendingComparator(a, b, orderBy)
      : (a: any, b: any) => -descendingComparator(a, b, orderBy);
  };

  // Aplicar ordenação às transações
  const sortedTransactions = React.useMemo(() => {
    return [...transactions].sort(getComparator(order, orderBy));
  }, [transactions, order, orderBy]);

  // Componente para cabeçalho ordenável
  const SortableTableCell = ({ children, sortKey, align = 'left', ...props }: {
    children: React.ReactNode;
    sortKey: string;
    align?: 'left' | 'right' | 'center';
    [key: string]: any;
  }) => {
    const isActive = orderBy === sortKey;
    const isAsc = isActive && order === 'asc';

    return (
      <TableCell
        {...props}
        align={align}
        sx={{
          fontWeight: 600,
          color: colors.gray[700],
          bgcolor: colors.gray[50],
          borderBottom: `2px solid ${colors.gray[200]}`,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': {
            bgcolor: colors.gray[100]
          },
          ...props.sx
        }}
        onClick={() => handleSort(sortKey)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {children}
          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
            <Box
              sx={{
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: `4px solid ${
                  isActive && !isAsc ? colors.primary[600] : colors.gray[400]
                }`,
                mb: 0.2
              }}
            />
            <Box
              sx={{
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `4px solid ${
                  isActive && isAsc ? colors.primary[600] : colors.gray[400]
                }`
              }}
            />
          </Box>
        </Box>
      </TableCell>
    );
  };

  // Formatação de valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Cor do tipo de transação
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Receita': return '#4caf50';
      case 'Despesa': return '#f44336';
      case 'Investimento': return '#2196f3';
      default: return '#757575';
    }
  };

  // Verificar se transação está vencida
  const isTransactionOverdue = (transaction: Transaction) => {
    if (transaction.is_paid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionDate = new Date(transaction.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate < today;
  };

  // Verificar se transação vence hoje
  const isTransactionDueToday = (transaction: Transaction) => {
    if (transaction.is_paid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionDate = new Date(transaction.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate.getTime() === today.getTime();
  };

  // Obter status da transação
  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.is_paid) return 'Pago';
    if (isTransactionOverdue(transaction)) return 'Vencido';
    return 'Em aberto';
  };

  // Obter cor do status
  const getStatusColor = (transaction: Transaction) => {
    if (transaction.is_paid) return { bg: '#e8f5e8', color: '#2e7d32', border: '#4caf50' };
    if (isTransactionOverdue(transaction)) return { bg: '#ffebee', color: '#d32f2f', border: '#f44336' };
    return { bg: '#fff3e0', color: '#f57c00', border: '#ff9800' };
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Controle Mensal
        </Typography>
        {/* Exemplo de label/filtro para garantir renderização */}
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" onClick={() => handleNewTransaction('Despesa')}>
            + Nova Despesa
          </Button>
        </Box>
        {/* Renderização da tabela de transações (simplificada) */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Pago?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.amount}</TableCell>
                  <TableCell>{t.transaction_type}</TableCell>
                  <TableCell>{t.is_paid ? 'Sim' : 'Não'}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nenhuma transação encontrada</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
}
