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
import { transactionService, PaymentData } from '../services/transactionService';
import PaymentDialog from '../components/PaymentDialog';
import axios from 'axios';
import { ModernHeader, ModernSection, ModernCard, ModernStatsCard } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';
import { useAuth } from '../contexts/AuthContext';

interface ServiceTransaction extends Transaction {
  is_recurring: boolean;
}

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
  recurrence_type?: 'unica' | 'mensal' | 'semanal' | 'personalizado' | 'fixo';
  recurrence_count?: number;
  recurrence_interval?: number;
  recurrence_weekday?: number;
  recurrence_end_date?: string;
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
  bank_account_id?: number | null;
  card_id?: number | null;
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
  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>(() => {
    // Inicializa os filtros com valores padrão
    const defaultFilters: Filters = {
      transaction_type: [],
      payment_status_id: ['unpaid', 'overdue'], // 'unpaid' = 'Em aberto', 'overdue' = 'Vencido'
      category_id: [],
      subcategory_id: '',
      contact_id: [],
      cost_center_id: [] // Inicialmente vazio
    };
    
    // Se o usuário tem um centro de custo associado, adiciona-o ao filtro por padrão
    if (user?.cost_center_id) {
      defaultFilters.cost_center_id = [user.cost_center_id.toString()];
    }
    
    return defaultFilters;
  });
  
  // O filtro já é inicializado com o centro de custo do usuário, se existir
  // Não estamos mais utilizando useEffect para atualizar o filtro depois
  
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
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
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
    payment_status_id: '1',
    contact_id: '',
    cost_center_id: user?.cost_center_id?.toString() || '',
    transaction_type: 'Despesa',
    bank_account_id: '',
    card_id: '',
    is_paid: false,
    is_recurring: false,
    recurrence_type: 'mensal',
    recurrence_count: 1,
    recurrence_interval: 1,
    recurrence_weekday: 1,
    recurrence_end_date: '',
    is_installment: false,
    total_installments: 2 as number | ''
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
  
  // Garantir que os amounts sejam números válidos antes de somar
  const totalReceitas = transactions
    .filter(t => t.transaction_type === 'Receita')
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);
    
  const totalDespesas = transactions
    .filter(t => t.transaction_type === 'Despesa')
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);
    
  const totalInvestimentos = transactions
    .filter(t => t.transaction_type === 'Investimento')
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);

  // Cálculo dos totalizadores das transações selecionadas
  const selectedTransactionsData = transactions.filter(t => selectedTransactions.includes(t.id));
  const totalSelectedReceitas = selectedTransactionsData
    .filter(t => t.transaction_type === 'Receita')
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);
    
  const totalSelectedDespesas = selectedTransactionsData
    .filter(t => t.transaction_type === 'Despesa')
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);
    
  const totalSelectedInvestimentos = selectedTransactionsData
    .filter(t => t.transaction_type === 'Investimento')
    .reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);
    
  const totalSelected = totalSelectedReceitas - totalSelectedDespesas - totalSelectedInvestimentos;
  const totalPeriodo = totalReceitas - totalDespesas - totalInvestimentos;

  // Cálculos dos totalizadores
  const vencidos = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return t.is_paid !== undefined ? !t.is_paid && transactionDate < today : false;
  });

  const vencemHoje = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return t.is_paid !== undefined ? !t.is_paid && transactionDate.getTime() === today.getTime() : false;
  });

  const aVencer = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date + 'T00:00:00');
    transactionDate.setHours(0, 0, 0, 0);
    return t.is_paid !== undefined ? !t.is_paid && transactionDate > today : false;
  });

  const totalVencidos = vencidos.reduce((sum, t) => {
    const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
    return sum + (t.transaction_type === 'Despesa' ? -amount : amount);
  }, 0);
  
  const totalVencemHoje = vencemHoje.reduce((sum, t) => {
    const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
    return sum + (t.transaction_type === 'Despesa' ? -amount : amount);
  }, 0);
  
  const totalAVencer = aVencer.reduce((sum, t) => {
    const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
    return sum + (t.transaction_type === 'Despesa' ? -amount : amount);
  }, 0);
  
  // Cálculo do saldo do período (com investimentos)
  // Quando há transações selecionadas, mostrar o saldo das transações selecionadas
  // Caso contrário, mostrar o saldo de todas as transações
  const saldoPeriodo = selectedTransactions.length > 0 
    ? totalSelectedReceitas - totalSelectedDespesas - totalSelectedInvestimentos
    : totalReceitas - totalDespesas - totalInvestimentos;

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
      
      // Ajustar ano e mês
      while (newMonth > 12) {
        newMonth -= 12;
        newYear += 1;
      }
      while (newMonth < 1) {
        newMonth += 12;
        newYear -= 1;
      }
      
      // Verificar se o dia existe no novo mês
      const daysInMonth = new Date(newYear, newMonth, 0).getDate();
      let newDay = day;
      
      // Se o dia não existe no novo mês, ajustar para o último dia do mês
      // Mas respeitando a regra: se for dia 31 e o mês não tem 31, usar o dia anterior (30)
      // e não o próximo (01 do próximo mês)
      if (newDay > daysInMonth) {
        newDay = daysInMonth;
      }
      
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
            const [year, month, day] = formData.transaction_date.split('-').map(Number);
            let newYear = year + i;
            
            // Verificar se o dia existe no novo ano/mês (para 29 de fevereiro em anos não bissextos)
            const daysInMonth = new Date(newYear, month, 0).getDate();
            const newDay = Math.min(day, daysInMonth);
            
            resultDate = newYear + '-' + String(month).padStart(2, '0') + '-' + String(newDay).padStart(2, '0');
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
      } else {
        // Para "Todo o período", não aplicar filtros de data
        startDate = undefined;
        endDate = undefined;
      }
      
      // Preparar parâmetros de filtro
      const baseParams: any = {
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => {
          // Tratar filtros de array e payment_status_id separadamente
          if (key === 'payment_status_id' || key === 'transaction_type' || key === 'contact_id' || key === 'category_id') {
            return false; // Não incluir nos parâmetros da URL (serão aplicados no frontend)
          }
          // Tratar filtro de centro de custo separadamente
          if (key === 'cost_center_id') {
            return false; // Não incluir nos parâmetros da URL (será aplicado no frontend)
          }
          // Tratar filtro de subcategoria separadamente
          if (key === 'subcategory_id') {
            return false; // Não incluir nos parâmetros da URL (será aplicado no frontend)
          }
          return Array.isArray(value) ? value.length > 0 : value !== '';
        }))
      };
      
      // Adicionar parâmetros de data apenas se não for "Todo o período"
      if (dateFilterType !== 'all' && startDate && endDate) {
        baseParams.start_date = startDate;
        baseParams.end_date = endDate;
      } else if (dateFilterType === 'all') {
        // Para "Todo o período", remover quaisquer filtros de data existentes
        delete baseParams.start_date;
        delete baseParams.end_date;
      }
      
      // Adicionar filtro de centro de custo
      if (filters.cost_center_id.length > 0) {
        // Converter para string separada por vírgula para o backend
        baseParams.cost_center_id = filters.cost_center_id.join(',');
        console.log('Centro de custo selecionados - array:', JSON.stringify(filters.cost_center_id));
        console.log('Centro de custo selecionados - string:', filters.cost_center_id.join(','));
      } else {
        // Se nenhum filtro estiver selecionado, mostrar todos os registros
        baseParams.cost_center_id = 'all';
        console.log('Mostrando todos os centros de custo (sem filtro)');
      }
      
      const params = new URLSearchParams(baseParams);
      
      console.log('Enviando requisição para /api/transactions com os parâmetros:', params.toString());
      console.log('Parâmetros originais:', baseParams);
      console.log('Filtro de centro de custo atual:', filters.cost_center_id);
      
      
      const response = await api.get(`/transactions?${params}`);
      console.log("Resposta da API recebida:", response.data);
      
      // Aplicar filtros no frontend
      let filteredTransactions = response.data;
      
      // Converter o campo is_paid baseado no payment_status_id antes de aplicar filtros
      filteredTransactions = filteredTransactions.map((t: any) => ({
        ...t,
        is_paid: t.payment_status_id === 2
      }));
      
      // Filtro de status de pagamento
      if (filters.payment_status_id.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => {
          if (filters.payment_status_id.includes('paid') && t.is_paid) return true;
          if (filters.payment_status_id.includes('unpaid') && !t.is_paid) return true;
          if (filters.payment_status_id.includes('overdue') && !t.is_paid && new Date(t.transaction_date) < new Date()) return true;
          if (filters.payment_status_id.includes('cancelled') && t.payment_status_id === 3) return true; // Assumindo status 3 para cancelado
          return false;
        });
      } else {
        // Se não houver filtro de status, mostrar apenas registros não pagos
        filteredTransactions = filteredTransactions.filter((t: any) => !t.is_paid);
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
      
      // Filtro de subcategoria
      if (filters.subcategory_id) {
        filteredTransactions = filteredTransactions.filter((t: any) => 
          t.subcategory_id?.toString() === filters.subcategory_id
        );
      }
      
      // Sempre incluir registros vencidos (data < hoje e em aberto), independentemente dos filtros de data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Buscar registros vencidos separadamente apenas se o filtro de situação incluir 'overdue' ou 'unpaid'
      let overdueTransactions: any[] = [];
      if (filters.payment_status_id.length === 0 || 
          filters.payment_status_id.includes('overdue') || 
          filters.payment_status_id.includes('unpaid')) {
        
        const overdueParams = { ...baseParams };
        // Remover filtros de data para buscar todos os vencidos
        delete overdueParams.start_date;
        delete overdueParams.end_date;
        
        try {
          // Garantir que estamos buscando apenas registros não pagos
          const overdueResponse = await api.get(`/transactions?${new URLSearchParams(overdueParams)}`);
          // Converter o campo is_paid baseado no payment_status_id
          const overdueData = overdueResponse.data.map((t: any) => ({
            ...t,
            is_paid: t.payment_status_id === 2
          }));
          
          overdueTransactions = overdueData.filter((t: any) => {
            const transactionDate = new Date(t.transaction_date + 'T00:00:00');
            transactionDate.setHours(0, 0, 0, 0);
            // Verificar se a transação está vencida (data < hoje) e não paga
            return !t.is_paid && transactionDate < today;
          });
          
          // Aplicar os mesmos filtros aos registros vencidos (exceto data)
          // Filtro de tipo de transação
          if (filters.transaction_type.length > 0) {
            overdueTransactions = overdueTransactions.filter((t: any) => 
              filters.transaction_type.includes(t.transaction_type)
            );
          }
          
          // Filtro de contato
          if (filters.contact_id.length > 0) {
            overdueTransactions = overdueTransactions.filter((t: any) => 
              filters.contact_id.includes(t.contact_id?.toString() || '')
            );
          }
          
          // Filtro de categoria
          if (filters.category_id.length > 0) {
            overdueTransactions = overdueTransactions.filter((t: any) => 
              filters.category_id.includes(t.category_id?.toString() || '')
            );
          }
          
          // Filtro de centro de custo
          if (filters.cost_center_id.length > 0) {
            overdueTransactions = overdueTransactions.filter((t: any) => 
              filters.cost_center_id.includes(t.cost_center_id?.toString() || '')
            );
          }
          
          // Filtro de subcategoria
          if (filters.subcategory_id) {
            overdueTransactions = overdueTransactions.filter((t: any) => 
              t.subcategory_id?.toString() === filters.subcategory_id
            );
          }
          
          // Filtro de status de pagamento - aplicar também aos vencidos
          if (filters.payment_status_id.length > 0) {
            overdueTransactions = overdueTransactions.filter((t: any) => {
              // Para registros vencidos, verificar se 'overdue' ou 'unpaid' estão nos filtros
              return (filters.payment_status_id.includes('overdue') || filters.payment_status_id.includes('unpaid')) && 
                     !t.is_paid; // Garantir que registros vencidos não estão pagos
            });
          } else {
            // Se não houver filtro de status, mostrar apenas vencidos não pagos
            overdueTransactions = overdueTransactions.filter((t: any) => !t.is_paid);
          }
        } catch (error) {
          console.error('Erro ao carregar transações vencidas:', error);
          // Se houver erro ao carregar transações vencidas, continuar com a lista filtrada normalmente
          overdueTransactions = [];
        }
      }
      
      // Combinar transações filtradas com transações vencidas
      const combinedTransactions = [...filteredTransactions, ...overdueTransactions];
      
      // Garantir que não há transações duplicadas baseado no ID
      const uniqueTransactions = combinedTransactions.reduce((acc: any[], transaction: any) => {
        if (!acc.some((t: any) => t.id === transaction.id)) {
          acc.push(transaction);
        }
        return acc;
      }, []);
      
      setTransactions(uniqueTransactions.map((transaction: any) => ({
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
        // Garantir que o campo is_paid esteja corretamente definido
        is_paid: transaction.is_paid !== undefined ? transaction.is_paid : transaction.payment_status_id === 2,
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
      // Em caso de erro, definir transações como array vazio para evitar estado inconsistente
      setTransactions([]);
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
    } as ServiceTransaction);
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
      is_recurring: false,
      is_paid: false
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
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      category_id: '',
      subcategory_id: '',
      payment_status_id: '1',
      contact_id: '',
      cost_center_id: user?.cost_center_id?.toString() || '',
      transaction_type: 'Despesa',
      bank_account_id: '',
      card_id: '',
      is_paid: false,
      is_recurring: false,
      recurrence_type: 'mensal',
      recurrence_count: 1,
      recurrence_interval: 1,
      recurrence_weekday: 1,
      recurrence_end_date: '',
      is_installment: false,
      total_installments: 2
    });
    setRecurrencePreview([]);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleOpenNewTransactionMenu = () => {
    resetForm();
    setEditingTransaction(null);
    setNewTransactionMenuAnchor(null);
    setTransactionDialogOpen(true);
  };

  const handleCloseTransactionDialog = () => {
    setTransactionDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleNewTransaction = (type: 'Despesa' | 'Receita' | 'Investimento') => {
    console.log('Criando nova transação do tipo:', type);
    resetForm();
    setFormData(prev => ({
      ...prev,
      transaction_type: type
    }));
    setEditingTransaction(null);
    setNewTransactionMenuAnchor(null);
    setTransactionDialogOpen(true);
  };

  const handleCreateTransaction = (type: 'Despesa' | 'Receita' | 'Investimento') => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      transaction_type: type,
      is_installment: false,
      total_installments: 2
    }));
    setEditingTransaction(null);
    setRecurrencePreview([]);
    setTransactionDialogOpen(true);
    setNewTransactionMenuAnchor(null);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando submit da transação. FormData:', formData);
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
      
      // Validação adicional para transações parceladas
      if (formData.is_installment) {
        console.log('Validando transação parcelada. Total de parcelas:', formData.total_installments);
        const totalInstallments = typeof formData.total_installments === 'string' ? parseInt(formData.total_installments) : formData.total_installments;
        if (!totalInstallments || totalInstallments < 2) {
          showSnackbar('Para transações parceladas, o número total de parcelas deve ser maior que 1', 'error');
          return;
        }
      }
      
      // Validação adicional para transações recorrentes
      if (formData.is_recurring) {
        if (!formData.recurrence_type) {
          showSnackbar('Tipo de recorrência é obrigatório', 'error');
          return;
        }
        if (formData.recurrence_type === 'personalizada' && !formData.recurrence_end_date) {
          showSnackbar('Data final é obrigatória para recorrência personalizada', 'error');
          return;
        }
        if (formData.recurrence_type === 'personalizada' && (!formData.recurrence_count || formData.recurrence_count < 1)) {
          showSnackbar('Número de repetições é obrigatório para recorrência personalizada', 'error');
          return;
        }
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
      
      // Preparar dados da transação
      const transactionData: any = {
        description: formData.description,
        amount: parseBrazilianNumber(formData.amount),
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        payment_status_id: formData.payment_status_id ? parseInt(formData.payment_status_id) : null,
        contact_id: formData.contact_id ? parseInt(formData.contact_id) : null,
        cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : null,
        is_paid: formData.is_paid,
        bank_account_id: null,
        card_id: null
      };

      // Adicionar campos de recorrência se necessário
      if (formData.is_recurring) {
        transactionData.is_recurring = true;
        transactionData.recurrence_type = formData.recurrence_type;
        transactionData.recurrence_count = formData.recurrence_count;
        transactionData.recurrence_interval = formData.recurrence_type === 'personalizada' ? formData.recurrence_interval : null;
        transactionData.recurrence_weekday = formData.recurrence_type === 'semanal' ? formData.recurrence_weekday : null;
        transactionData.recurrence_end_date = formData.recurrence_type === 'personalizada' ? formData.recurrence_end_date : null;
      } else {
        transactionData.is_recurring = false;
      }

      // Adicionar campos de parcelamento se necessário
      if (formData.is_installment) {
        transactionData.is_installment = true;
        transactionData.total_installments = typeof formData.total_installments === 'string' ? parseInt(formData.total_installments) : formData.total_installments;
        // Garantir que o número total de parcelas é válido
        if (transactionData.total_installments < 2) {
          transactionData.total_installments = 2;
        }
        console.log('Dados de transação parcelada:', transactionData);
      } else {
        transactionData.is_installment = false;
        transactionData.total_installments = null;
      }

      // Garantir que os campos de parcelamento estão corretamente definidos
      if (transactionData.is_installment && !transactionData.total_installments) {
        transactionData.total_installments = 2;
      }

      console.log('Enviando dados da transação:', transactionData);

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, transactionData);
        showSnackbar('Transação atualizada com sucesso!');
      } else {
        const response = await api.post('/transactions', transactionData);
        console.log('Resposta da criação de transação:', response.data);
        if (response.data && response.data.count && response.data.count > 1) {
          showSnackbar(`${response.data.count} transações criadas com sucesso!`);
        } else if (response.data && response.data.message) {
          showSnackbar(response.data.message);
        } else {
          showSnackbar('Transação criada com sucesso!');
        }
      }

      handleCloseTransactionDialog();
      loadTransactions();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro Axios:', {
          message: error.message,
          config: error.config,
          response: error.response?.data,
          status: error.response?.status,
        });
        showSnackbar(`Erro ao salvar transação: ${error.response?.data?.error || error.message}`, 'error');
      } else {
        showSnackbar('Erro ao salvar transação', 'error');
      }
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

  // Aplicar ordenação às transações e remover possíveis duplicatas
  const sortedTransactions = React.useMemo(() => {
    // Primeiro, garantimos que não há duplicatas por ID
    const uniqueTransactions = Array.from(
      new Map(transactions.map(item => [item.id, item])).values()
    );
    
    // Adicionar logs para debug
    console.log('Transações únicas:', uniqueTransactions);
    uniqueTransactions.forEach((transaction, index) => {
      console.log(`Transação ${index}:`, {
        id: transaction.id,
        amount: transaction.amount,
        type: typeof transaction.amount
      });
    });
    
    // Depois aplicamos a ordenação
    return [...uniqueTransactions].sort(getComparator(order, orderBy));
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
      try {
        // Verificamos se a data da transação é válida antes de criar a data
        if (!transaction.transaction_date) return false;
        
        if (transaction.is_paid) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Processar a data da transação para garantir formato válido
        let transactionDate;
        
        if (transaction.transaction_date.includes('T')) {
          // Se já está no formato ISO completo com timestamp
          transactionDate = new Date(transaction.transaction_date);
        } else {
          // Se está apenas no formato YYYY-MM-DD
          transactionDate = new Date(transaction.transaction_date + 'T00:00:00');
        }
        
        // Verificar se a data é válida
        if (isNaN(transactionDate.getTime())) {
          console.error('Data inválida:', transaction.transaction_date);
          return false;
        }
        
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate < today;
      } catch (error) {
        console.error('Erro ao verificar se transação está vencida:', error);
        return false;
      }
  };

  // Verificar se transação vence hoje
  const isTransactionDueToday = (transaction: Transaction) => {
      try {
        // Verificamos se a data da transação é válida antes de criar a data
        if (!transaction.transaction_date) return false;
        
        if (transaction.is_paid) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Processar a data da transação para garantir formato válido
        let transactionDate;
        
        if (transaction.transaction_date.includes('T')) {
          // Se já está no formato ISO completo com timestamp
          transactionDate = new Date(transaction.transaction_date);
        } else {
          // Se está apenas no formato YYYY-MM-DD
          transactionDate = new Date(transaction.transaction_date + 'T00:00:00');
        }
        
        // Verificar se a data é válida
        if (isNaN(transactionDate.getTime())) {
          console.error('Data inválida:', transaction.transaction_date);
          return false;
        }
        
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate.getTime() === today.getTime();
      } catch (error) {
        console.error('Erro ao verificar se transação vence hoje:', error);
        return false;
      }
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
      <Box sx={{ minHeight: "100vh", bgcolor: colors.gray[50] }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: "100%" }, mx: "auto" }}>
            subtitle="Gerencie suas transações financeiras mensais"
            breadcrumbs={[
              { label: 'TrackeOne Finance' },
              { label: 'Controle Mensal' }
            ]}
            actions={(
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderRadius: 1.5,
                    borderColor: colors.gray[300],
                    color: colors.gray[700],
                    '&:hover': {
                      borderColor: colors.primary[400],
                      bgcolor: colors.primary[50]
                    }
                  }}
                >
                  Exportar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={(e) => setNewTransactionMenuAnchor(e.currentTarget)}
                  sx={{
                    background: gradients.primary,
                    borderRadius: 1.5,
                    boxShadow: shadows.md,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      boxShadow: shadows.lg
                    }
                  }}
                >
                  Nova Transação
                </Button>
              </Box>
            )}
          />

          {/* Modern Filters Section */}
          <Box sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            mb: 3,
            border: `1px solid ${colors.gray[200]}`,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            transition: 'all 0.3s ease'
          }}>
            {/* Main Filters Row */}
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 1, sm: 1.5, md: 2 },
              alignItems: 'center',
              mb: moreFiltersOpen ? 2 : 0
            }}>
              {/* Period Type Selector */}
              <FormControl size="small" sx={{ minWidth: 120, flex: '0 0 auto' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Período</InputLabel>
                <Select
                  value={dateFilterType}
                  label="Período"
                  onChange={(e) => setDateFilterType(e.target.value as 'month' | 'year' | 'custom' | 'all')}
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500],
                      borderWidth: 1
                    }
                  }}
                >
                  <MenuItem value="month">Mês</MenuItem>
                  <MenuItem value="year">Ano</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                  <MenuItem value="all">Todo o período</MenuItem>
                </Select>
              </FormControl>

              {/* Modern Calendar Picker */}
              {dateFilterType === 'month' && (
                <Box sx={{ minWidth: 180, flex: '0 0 auto' }}>
                  <DatePicker
                    views={['month', 'year']}
                    label="Mês e Ano"
                    value={currentDate}
                    onChange={(newValue) => newValue && setCurrentDate(newValue)}
                    slotProps={{
                      textField: { 
                        size: 'small',
                        fullWidth: true,
                        sx: { 
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#FFFFFF',
                            borderRadius: 1.5,
                            fontSize: '0.875rem',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'transparent'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.primary[300]
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.primary[500],
                              borderWidth: 1
                            }
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '0.875rem'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              )}

              {dateFilterType === 'year' && (
                <Box sx={{ minWidth: 120, flex: '0 0 auto' }}>
                  <DatePicker
                    views={['year']}
                    label="Ano"
                    value={new Date(selectedYear, 0, 1)}
                    onChange={(newValue) => newValue && setSelectedYear(newValue.getFullYear())}
                    slotProps={{
                      textField: { 
                        size: 'small',
                        fullWidth: true,
                        sx: { 
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#FFFFFF',
                            borderRadius: 1.5,
                            fontSize: '0.875rem',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'transparent'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.primary[300]
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.primary[500],
                              borderWidth: 1
                            }
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '0.875rem'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              )}

              {dateFilterType === 'custom' && (
                <>
                  <Box sx={{ minWidth: 140, flex: '0 0 auto' }}>
                    <DatePicker
                      label="Data inicial"
                      value={customStartDate}
                      onChange={(newValue) => setCustomStartDate(newValue)}
                      slotProps={{
                        textField: { 
                          size: 'small',
                          fullWidth: true,
                          sx: { 
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#FFFFFF',
                              borderRadius: 1.5,
                              fontSize: '0.875rem',
                              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.primary[300]
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.primary[500],
                                borderWidth: 1
                              }
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '0.875rem'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 140, flex: '0 0 auto' }}>
                    <DatePicker
                      label="Data final"
                      value={customEndDate}
                      onChange={(newValue) => setCustomEndDate(newValue)}
                      slotProps={{
                        textField: { 
                          size: 'small',
                          fullWidth: true,
                          sx: { 
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#FFFFFF',
                              borderRadius: 1.5,
                              fontSize: '0.875rem',
                              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.primary[300]
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.primary[500],
                                borderWidth: 1
                              }
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '0.875rem'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </>
              )}

              {/* Transaction Type */}
              <FormControl size="small" sx={{ minWidth: 100, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Tipo</InputLabel>
                <Select
                  multiple
                  value={filters.transaction_type}
                  label="Tipo"
                  onChange={(e) => setFilters(prev => ({ ...prev, transaction_type: e.target.value as string[] }))}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Todos';
                    if (selected.length === 1) return selected[0];
                    return `${selected.length} selecionados`;
                  }}
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500],
                      borderWidth: 1
                    }
                  }}
                >
                  <MenuItem value="Despesa">
                    <Checkbox 
                      checked={filters.transaction_type.includes('Despesa')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ExpenseIcon sx={{ fontSize: 16, color: colors.error[600] }} />
                      Despesa
                    </Box>
                  </MenuItem>
                  <MenuItem value="Receita">
                    <Checkbox 
                      checked={filters.transaction_type.includes('Receita')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IncomeIcon sx={{ fontSize: 16, color: colors.success[600] }} />
                      Receita
                    </Box>
                  </MenuItem>
                  <MenuItem value="Investimento">
                    <Checkbox 
                      checked={filters.transaction_type.includes('Investimento')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InvestmentIcon sx={{ fontSize: 16, color: colors.primary[600] }} />
                      Investimento
                    </Box>
                  </MenuItem>
                </Select>
                {filters.transaction_type.length > 0 && (
                  <Chip 
                    label={filters.transaction_type.length}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      height: 18,
                      minWidth: 18,
                      bgcolor: colors.primary[500],
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      zIndex: 1,
                      '& .MuiChip-label': {
                        px: 0.5
                      }
                    }}
                  />
                )}
              </FormControl>

              {/* Payment Status */}
              <FormControl size="small" sx={{ minWidth: 100, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Situação</InputLabel>
                <Select
                  multiple
                  value={filters.payment_status_id}
                  label="Situação"
                  onChange={(e) => setFilters(prev => ({ ...prev, payment_status_id: e.target.value as string[] }))}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Todos';
                    if (selected.length === 1) {
                      const statusMap: {[key: string]: string} = {
                        'paid': 'Pagos',
                        'unpaid': 'Em Aberto', 
                        'overdue': 'Vencidos',
                        'cancelled': 'Cancelados'
                      };
                      return statusMap[selected[0]] || selected[0];
                    }
                    return `${selected.length} selecionados`;
                  }}
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500],
                      borderWidth: 1
                    }
                  }}
                >
                  <MenuItem value="paid">
                    <Checkbox 
                      checked={filters.payment_status_id.includes('paid')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    Pagos
                  </MenuItem>
                  <MenuItem value="unpaid">
                    <Checkbox 
                      checked={filters.payment_status_id.includes('unpaid')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    Em Aberto
                  </MenuItem>
                  <MenuItem value="overdue">
                    <Checkbox 
                      checked={filters.payment_status_id.includes('overdue')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    Vencidos
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Checkbox 
                      checked={filters.payment_status_id.includes('cancelled')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    Cancelados
                  </MenuItem>
                </Select>
                {filters.payment_status_id.length > 0 && (
                  <Chip 
                    label={filters.payment_status_id.length}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      height: 18,
                      minWidth: 18,
                      bgcolor: colors.primary[500],
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      zIndex: 1,
                      '& .MuiChip-label': {
                        px: 0.5
                      }
                    }}
                  />
                )}
              </FormControl>

              {/* Cost Center */}
              <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Centro de Custo</InputLabel>
                <Select
                  multiple
                  value={filters.cost_center_id}
                  label="Centro de Custo"
                  onChange={(e) => setFilters(prev => ({ ...prev, cost_center_id: e.target.value as string[] }))}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Todos';
                    if (selected.length === 1) {
                      const costCenter = costCenters.find(cc => cc.id.toString() === selected[0]);
                      if (costCenter) {
                        return costCenter.number ? `${costCenter.number} - ${costCenter.name}` : costCenter.name;
                      }
                      return selected[0];
                    }
                    return `${selected.length} selecionados`;
                  }}
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500],
                      borderWidth: 1
                    }
                  }}
                >
                  {costCenters.map((costCenter) => (
                    <MenuItem key={costCenter.id} value={costCenter.id.toString()}>
                      <Checkbox 
                        checked={filters.cost_center_id.includes(costCenter.id.toString())} 
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                      />
                      {costCenter.number ? `${costCenter.number} - ${costCenter.name}` : costCenter.name}
                    </MenuItem>
                  ))}
                </Select>
                {filters.cost_center_id.length > 0 && (
                  <Chip 
                    label={filters.cost_center_id.length}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      height: 18,
                      minWidth: 18,
                      bgcolor: colors.primary[500],
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      zIndex: 1,
                      '& .MuiChip-label': {
                        px: 0.5
                      }
                    }}
                  />
                )}
              </FormControl>

              {/* Contact */}
              <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Contato</InputLabel>
                <Select
                  multiple
                  value={filters.contact_id}
                  label="Contato"
                  onChange={(e) => setFilters(prev => ({ ...prev, contact_id: e.target.value as string[] }))}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Todos';
                    if (selected.length === 1) {
                      const contact = contacts.find(c => c.id.toString() === selected[0]);
                      return contact ? contact.name : selected[0];
                    }
                    return `${selected.length} selecionados`;
                  }}
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500],
                      borderWidth: 1
                    }
                  }}
                >
                  {contacts.map((contact) => (
                    <MenuItem key={contact.id} value={contact.id.toString()}>
                      <Checkbox 
                        checked={filters.contact_id.includes(contact.id.toString())} 
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                      />
                      {contact.name}
                    </MenuItem>
                  ))}
                </Select>
                {filters.contact_id.length > 0 && (
                  <Chip 
                    label={filters.contact_id.length}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      height: 18,
                      minWidth: 18,
                      bgcolor: colors.primary[500],
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      zIndex: 1,
                      '& .MuiChip-label': {
                        px: 0.5
                      }
                    }}
                  />
                )}
              </FormControl>

              {/* Action Buttons Inline */}
              <Button
                variant="text"
                size="small"
                onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                sx={{ 
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  color: colors.gray[600],
                  bgcolor: '#FFFFFF',
                  borderRadius: 1.5,
                  flex: '0 0 auto',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  '&:hover': {
                    bgcolor: colors.gray[100],
                    color: colors.gray[700],
                    boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.15)'
                  }
                }}
              >
                <FilterIcon sx={{ fontSize: 18 }} />
              </Button>
              
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setFilters({
                    transaction_type: [],
                    payment_status_id: ['unpaid', 'overdue'], // 'unpaid' = 'Em aberto', 'overdue' = 'Vencido'
                    category_id: [],
                    subcategory_id: '',
                    contact_id: [],
                    cost_center_id: user?.cost_center_id ? [user.cost_center_id.toString()] : []
                  });
                  setDateFilterType('month');
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                }}
                sx={{ 
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  color: colors.gray[500],
                  bgcolor: '#FFFFFF',
                  borderRadius: 1.5,
                  flex: '0 0 auto',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  '&:hover': {
                    bgcolor: colors.gray[50],
                    color: colors.gray[600],
                    boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.15)'
                  }
                }}
              >
                <ClearIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>

            {/* Additional Filters Row */}
            {moreFiltersOpen && (
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 1.5, md: 2 },
                alignItems: 'center',
                pt: 2,
                borderTop: `1px solid ${colors.gray[100]}`,
                position: 'relative'
              }}>
                {/* Category */}
                <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Categoria</InputLabel>
                  <Select
                    multiple
                    value={filters.category_id}
                    label="Categoria"
                    onChange={(e) => {
                      const selected = e.target.value as string[];
                      setFilters(prev => ({ 
                        ...prev, 
                        category_id: selected,
                        subcategory_id: '' // Clear subcategory when category changes
                      }));
                    }}
                    renderValue={(selected) => {
                      if (selected.length === 0) return 'Todas';
                      if (selected.length === 1) {
                        const category = categories.find(cat => cat.id.toString() === selected[0]);
                        return category ? category.name : selected[0];
                      }
                      return `${selected.length} selecionadas`;
                    }}
                    sx={{ 
                      bgcolor: '#FFFFFF',
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'transparent',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primary[300],
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primary[500],
                        borderWidth: 1
                      }
                    }}
                  >
                    {categories.filter(cat => filters.transaction_type.length === 0 || filters.transaction_type.includes(cat.source_type)).map((category) => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        <Checkbox 
                          checked={filters.category_id.includes(category.id.toString())} 
                          size="small"
                          sx={{ mr: 1, p: 0 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: category.source_type === 'Despesa' ? colors.error[600] : category.source_type === 'Receita' ? colors.success[600] : colors.primary[600] }}>
                            {category.source_type === 'Despesa' && <ExpenseIcon sx={{ fontSize: 16 }} />}
                            {category.source_type === 'Receita' && <IncomeIcon sx={{ fontSize: 16 }} />}
                            {category.source_type === 'Investimento' && <InvestmentIcon sx={{ fontSize: 16 }} />}
                          </Box>
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {filters.category_id.length > 0 && (
                    <Chip 
                      label={filters.category_id.length}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        height: 18,
                        minWidth: 18,
                        bgcolor: colors.primary[500],
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        zIndex: 1,
                        '& .MuiChip-label': {
                          px: 0.5
                        }
                      }}
                    />
                  )}
                </FormControl>

                {/* Subcategory */}
                <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Subcategoria</InputLabel>
                  <Select
                    multiple
                    value={filters.subcategory_id ? [filters.subcategory_id] : []}
                    label="Subcategoria"
                    onChange={(e) => {
                      const selected = e.target.value as string[];
                      setFilters(prev => ({ 
                        ...prev, 
                        subcategory_id: selected.length > 0 ? selected[0] : ''
                      }));
                    }}
                    renderValue={(selected) => {
                      if (selected.length === 0) return 'Todas';
                      const subcategory = subcategories.find(sub => sub.id.toString() === selected[0]);
                      return subcategory ? subcategory.name : 'Selecionada';
                    }}
                    sx={{ 
                      bgcolor: '#FFFFFF',
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'transparent',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primary[300],
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primary[500],
                        borderWidth: 1
                      }
                    }}
                  >
                    {subcategories.filter(sub => {
                      // Se nenhuma categoria selecionada, mostrar todas as subcategorias filtradas por tipo de transação
                      if (filters.category_id.length === 0) {
                        if (filters.transaction_type.length === 0) return true;
                        const category = categories.find(cat => cat.id === sub.category_id);
                        return category && filters.transaction_type.includes(category.source_type);
                      }
                      // Se categorias selecionadas, mostrar apenas subcategorias dessas categorias
                      return filters.category_id.includes(sub.category_id.toString());
                    }).map((subcategory) => (
                      <MenuItem key={subcategory.id} value={subcategory.id.toString()}>
                        <Checkbox 
                          checked={filters.subcategory_id === subcategory.id.toString()} 
                          size="small"
                          sx={{ mr: 1, p: 0 }}
                        />
                        {subcategory.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {filters.subcategory_id && (
                    <Chip 
                      label={1}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        height: 18,
                        minWidth: 18,
                        bgcolor: colors.primary[500],
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        zIndex: 1,
                        '& .MuiChip-label': {
                          px: 0.5
                        }
                      }}
                    />
                  )}
                </FormControl>

                {/* Discrete Close Button */}
              </Box>
            )}
          </Box>

          {/* Modern Statistics Cards */}
          <Box sx={{ 
            display: 'flex',
            gap: { xs: 1, sm: 1.5, md: 2 },
            mb: 3,
            overflow: 'hidden',
            '& > *': {
              flex: '1 1 0',
              minWidth: 0
            }
          }}>
            <ModernStatsCard
              title="Vencidos"
              value={formatCurrency(Math.abs(totalVencidos))}
              subtitle="Pagamentos em atraso"
              icon={<ExpenseIcon sx={{ fontSize: 16 }} />}
              color="error"
              trend={{ value: 12.5, isPositive: false }}
            />
            
            <ModernStatsCard
              title="Vencem Hoje"
              value={formatCurrency(Math.abs(totalVencemHoje))}
              subtitle="Vencimento urgente"
              icon={<CalendarIcon sx={{ fontSize: 16 }} />}
              color="warning"
            />
            
            <ModernStatsCard
              title="A Vencer"
              value={formatCurrency(Math.abs(totalAVencer))}
              subtitle="Próximos vencimentos"
              icon={<ReceiptIcon sx={{ fontSize: 16 }} />}
              color="primary"
            />
            
            <ModernStatsCard
              title="Pagos"
              value={formatCurrency(transactions.filter(t => t.is_paid).reduce((sum, t) => sum + t.amount, 0))}
              subtitle="Já quitados"
              icon={<PaidIcon sx={{ fontSize: 16 }} />}
              color="success"
              trend={{ value: 8.3, isPositive: true }}
            />
            
            <ModernStatsCard
              title="Saldo do Período"
              value={formatCurrency(saldoPeriodo)}
              subtitle="Receitas - Despesas"
              icon={<AccountBalanceIcon sx={{ fontSize: 16 }} />}
              color={saldoPeriodo >= 0 ? 'success' : 'error'}
              trend={{ value: Math.abs((saldoPeriodo / 10000) * 100), isPositive: saldoPeriodo >= 0 }}
            />
          </Box>

          {/* Modern Transaction Counter and Actions */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ color: colors.gray[600], fontWeight: 500 }}>
                {selectedTransactions.length} de {transactions.length} registro(s) selecionado(s)
              </Typography>
              {selectedTransactions.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={(e) => setBatchActionsAnchor(e.currentTarget)}
                  sx={{
                    borderColor: colors.primary[300],
                    color: colors.primary[600],
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    px: 1,
                    py: 0.25,
                    minWidth: 'auto',
                    height: 24,
                    lineHeight: 1,
                    '&:hover': {
                      borderColor: colors.primary[400],
                      bgcolor: colors.primary[50]
                    }
                  }}
                >
                  Ações em Lote
                </Button>
              )}
            </Box>
          </Box>

          {/* Transaction Table */}
          <Box sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: 0,
            border: `1px solid ${colors.gray[200]}`,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.gray[50] }}>
                    <TableCell 
                      padding="checkbox" 
                      sx={{ 
                        width: '4%',
                        bgcolor: colors.gray[50],
                        borderBottom: `2px solid ${colors.gray[200]}`
                      }}
                    >
                      <Checkbox
                        checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                        indeterminate={selectedTransactions.length > 0 && selectedTransactions.length < transactions.length}
                        onChange={handleSelectAllTransactions}
                        sx={{ color: colors.primary[600] }}
                      />
                    </TableCell>
                    <SortableTableCell sortKey="transaction_date" sx={{ width: '8%' }}>
                      Vencimento
                    </SortableTableCell>
                    <SortableTableCell sortKey="description" sx={{ width: '50%' }}>
                      Descrição
                    </SortableTableCell>
                    <SortableTableCell sortKey="amount" align="right" sx={{ width: '15%' }}>
                      Total (R$)
                    </SortableTableCell>
                    <SortableTableCell sortKey="status" align="center" sx={{ width: '13%' }}>
                      Situação
                    </SortableTableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      width: '10%',
                      color: colors.gray[700],
                      bgcolor: colors.gray[50],
                      borderBottom: `2px solid ${colors.gray[200]}`
                    }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {sortedTransactions.map((transaction) => {
                  const statusColors = getStatusColor(transaction);
                  const isOverdue = isTransactionOverdue(transaction);
                  const isDueToday = isTransactionDueToday(transaction);
                  
                  // Definir cor de fundo baseada no status da transação
                  const getRowBackgroundColor = () => {
                    if (selectedTransactions.includes(transaction.id)) {
                      if (isOverdue) return colors.error[50];
                      if (isDueToday) return '#fff3e0'; // Amarelo claro como no cartão "Vencem Hoje"
                      return colors.primary[50];
                    }
                    if (isOverdue) return colors.error[50];
                    if (isDueToday) return '#fff3e0'; // Amarelo claro como no cartão "Vencem Hoje"
                    return 'white';
                  };

                  const getHoverBackgroundColor = () => {
                    if (isOverdue) return colors.error[50];
                    if (isDueToday) return '#ffcc02'; // Amarelo mais intenso no hover
                    return colors.primary[50];
                  };
                  
                  return (
                  <TableRow 
                    key={transaction.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: getHoverBackgroundColor(),
                        transform: 'translateY(-1px)',
                        boxShadow: shadows.sm
                      },
                      bgcolor: getRowBackgroundColor(),
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={() => handleSelectTransaction(transaction.id)}
                      />
                    </TableCell>
                    
                    <TableCell sx={{ minWidth: 90 }}>
                      <Typography variant="body2">
                        {format(
                          transaction.transaction_date.includes('T') 
                            ? new Date(transaction.transaction_date) 
                            : new Date(`${transaction.transaction_date}T12:00:00`), 
                          'dd/MM/yyyy'
                        )}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        {/* Ícone específico por tipo de transação */}
                        <Box 
                          sx={{ 
                            p: 0.5,
                            mt: 0.5,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: transaction.transaction_type === 'Despesa' ? '#ffebee' : 
                                   transaction.transaction_type === 'Receita' ? '#e8f5e8' : 
                                   '#e3f2fd',
                            color: transaction.transaction_type === 'Despesa' ? '#f44336' : 
                                  transaction.transaction_type === 'Receita' ? '#4caf50' : 
                                  '#2196f3'
                          }}
                        >
                          {transaction.transaction_type === 'Despesa' && <ExpenseIcon fontSize="small" />}
                          {transaction.transaction_type === 'Receita' && <IncomeIcon fontSize="small" />}
                          {transaction.transaction_type === 'Investimento' && <InvestmentIcon fontSize="small" />}
                        </Box>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 0.5,
                              wordBreak: 'break-word',
                              lineHeight: 1.2,
                              fontWeight: 500
                            }}
                          >
                            {transaction.is_installment && transaction.installment_number && transaction.total_installments 
                              ? `${transaction.description} (${transaction.installment_number}/${transaction.total_installments})`
                              : transaction.description
                            }
                          </Typography>
                          
                          {/* Informações adicionais em containers separados */}
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {transaction.contact && (
                              <Chip 
                                label={transaction.contact.name} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.65rem', 
                                  height: 18,
                                  bgcolor: 'white',
                                  '& .MuiChip-label': {
                                    px: 0.5
                                  }
                                }}
                              />
                            )}
                            {transaction.category && (
                              <Chip 
                                label={`${transaction.category.name}${transaction.subcategory ? ` > ${transaction.subcategory.name}` : ''}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.65rem', 
                                  height: 18,
                                  bgcolor: 'white',
                                  '& .MuiChip-label': {
                                    px: 0.5
                                  }
                                }}
                              />
                            )}
                            {transaction.cost_center && (
                              <Chip 
                                label={transaction.cost_center.number ? `${transaction.cost_center.number} - ${transaction.cost_center.name}` : transaction.cost_center.name} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.65rem', 
                                  height: 18,
                                  bgcolor: 'white',
                                  '& .MuiChip-label': {
                                    px: 0.5
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="right" sx={{ minWidth: 120 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: getTransactionTypeColor(transaction.transaction_type)
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ minWidth: 100 }} align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Chip
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: 'currentColor',
                                  flexShrink: 0
                                }}
                              />
                              <span>{getTransactionStatus(transaction)}</span>
                            </Box>
                          }
                          size="small"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 22,
                            bgcolor: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`,
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ minWidth: 60 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionMenuOpen(e, transaction.id)}
                        sx={{ color: '#666' }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  );
                })}
                
                {transactions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma transação encontrada para este período
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Totalizador das transações filtradas */}
                
                {/* Totalizador das transações selecionadas */}
                {selectedTransactions.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      Total Selecionado ({selectedTransactions.length} registro{selectedTransactions.length !== 1 ? 's' : ''}):
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(totalSelected)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
