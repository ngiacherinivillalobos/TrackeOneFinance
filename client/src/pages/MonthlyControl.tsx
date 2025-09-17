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
  CheckCircle as CheckCircleIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, addMonths, subMonths } from 'date-fns';
import api from '../lib/axios';
import { transactionService, PaymentData, Transaction as ServiceTransaction } from '../services/transactionService';
import { bankAccountBalanceService } from '../services/bankAccountBalanceService';
import { categoryService } from '../services/categoryService';
import { subcategoryService } from '../services/subcategoryService';
import { costCenterService } from '../services/costCenterService';
import PaymentDialog from '../components/PaymentDialog';
import axios from 'axios';
import { ModernHeader, ModernSection, ModernCard, ModernStatsCard } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';
import { useAuth } from '../contexts/AuthContext';
import { createSafeDate, formatDateToLocal } from '../utils/dateUtils';

// Helper function para converter datas de forma segura
const formatSafeDate = (dateString: string): string => {
  try {
    // Se a data já está no formato ISO (PostgreSQL: "2025-09-05T00:00:00.000Z")
    if (dateString.includes('T')) {
      // Extrair apenas a parte da data YYYY-MM-DD e criar data local
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      const localDate = new Date(year, month - 1, day); // mês é 0-indexed
      return format(localDate, 'dd/MM/yyyy');
    }
    // Se é apenas YYYY-MM-DD (SQLite), criar data local diretamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return format(localDate, 'dd/MM/yyyy');
    }
    // Fallback: tentar converter diretamente
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch (error) {
    console.warn('Erro ao converter data:', dateString, error);
    return 'Data inválida';
  }
};

// Helper function para converter datas para objeto Date de forma segura
// Usar createSafeDate do utilitário de datas
const getSafeDate = createSafeDate;

// Função helper para converter valores monetários de forma segura
const getSafeAmount = (amount: any): number => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

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
  // Adicionar campo payment_status_id para consistência entre ambientes
  payment_status_id?: number;
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
  // Hook de autenticação para obter dados do usuário
  const { user } = useAuth();
  
  // Responsividade
  const theme = useTheme();
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  
  // Estados
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Transações filtradas para exibição na tabela
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // TODAS as transações para cálculo de totalizadores
  const [overdueTransactionsForTotals, setOverdueTransactionsForTotals] = useState<Transaction[]>([]); // Transações vencidas para totalizadores
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
    payment_status_id: ['unpaid', 'overdue'], // Filtro padrão: Em aberto e Vencido
    category_id: [],
    subcategory_id: '',
    contact_id: [],
    cost_center_id: user?.cost_center_id ? [user.cost_center_id.toString()] : [] // Centro de custo do usuário logado
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
  const [initialBankAccountsBalance, setInitialBankAccountsBalance] = useState<number>(0);
  
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
    transaction_date: formatDateToLocal(new Date()),
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

  // CÁLCULO DOS TOTALIZADORES - VERSÃO SIMPLIFICADA E DEFINITIVA
  // Totalizadores devem considerar:
  // 1. TODAS as transações do período selecionado (qualquer status)
  // 2. TODAS as transações vencidas (qualquer status)
  // 3. Filtro por centro de custo selecionado
  
  // Aplicar filtro de centro de custo nos totalizadores
  const filteredAllTransactions = allTransactions.filter(t => {
    // Se não há filtro de centro de custo, mostrar todos
    if (filters.cost_center_id.length === 0) return true;
    // Aplicar filtro de centro de custo
    return filters.cost_center_id.includes(t.cost_center?.id?.toString() || '');
  });
  
  // Detectar se é um dia específico (customStartDate === customEndDate)
  const isSingleDay = dateFilterType === 'custom' && 
                      customStartDate && 
                      customEndDate && 
                      format(customStartDate, 'yyyy-MM-dd') === format(customEndDate, 'yyyy-MM-dd');
  
  let totalReceitas, totalDespesas, totalInvestimentos;
  
  if (isSingleDay && customStartDate) {
    // Para um dia específico, calcular saldo previsto até aquele dia
    // Buscar todas as transações até a data selecionada (incluindo vencidas)
    const selectedDate = format(customStartDate, 'yyyy-MM-dd');
    const transactionsUpToDate = filteredAllTransactions.filter(t => {
      if (!t.transaction_date) return false;
      const transactionDate = format(getSafeDate(t.transaction_date), 'yyyy-MM-dd');
      return transactionDate <= selectedDate;
    });
    
    const receitasUpToDate = transactionsUpToDate
      .filter(t => t.transaction_type === 'Receita')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    const despesasUpToDate = transactionsUpToDate
      .filter(t => t.transaction_type === 'Despesa')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);

    const investimentosUpToDate = transactionsUpToDate
      .filter(t => t.transaction_type === 'Investimento')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
    
    // Para um dia específico: mostrar SALDO ACUMULADO PREVISTO até aquele dia
    const saldoPrevisto = initialBankAccountsBalance + receitasUpToDate - despesasUpToDate - investimentosUpToDate;
    
    // Nos totalizadores, mostrar o saldo previsto dividido proporcionalmente
    // Receitas: saldo inicial + receitas até o dia
    totalReceitas = initialBankAccountsBalance + receitasUpToDate;
    // Despesas: apenas despesas até o dia (valor negativo será exibido)
    totalDespesas = despesasUpToDate;
    // Investimentos: apenas investimentos até o dia
    totalInvestimentos = investimentosUpToDate;
  } else {
    // Usar filteredAllTransactions que agora contém período + vencidas SEM filtros de status MAS COM filtro de centro de custo
    totalReceitas = filteredAllTransactions
      .filter(t => t.transaction_type === 'Receita')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    totalDespesas = filteredAllTransactions
      .filter(t => t.transaction_type === 'Despesa')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);

    totalInvestimentos = filteredAllTransactions
      .filter(t => t.transaction_type === 'Investimento')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
  }

  // Cálculos dos totalizadores - CORRIGIDO PARA USAR DATAS CONSISTENTES E VERIFICAR AMBOS OS CAMPOS DE STATUS
  const vencidos = transactions.filter(t => {
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = t.is_paid || t.payment_status_id === 2;
    if (!t.transaction_date || isPaid) return false;
    const transactionDate = getSafeDate(t.transaction_date);
    transactionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactionDate < today;
  });

  const vencemHoje = transactions.filter(t => {
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = t.is_paid || t.payment_status_id === 2;
    if (!t.transaction_date || isPaid) return false;
    const transactionDate = getSafeDate(t.transaction_date);
    transactionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactionDate.getTime() === today.getTime();
  });

  const aVencer = transactions.filter(t => {
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = t.is_paid || t.payment_status_id === 2;
    if (!t.transaction_date || isPaid) return false;
    const transactionDate = getSafeDate(t.transaction_date);
    transactionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactionDate > today;
  });

  const totalVencidos = vencidos.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -getSafeAmount(t.amount) : getSafeAmount(t.amount)), 0);
  const totalVencemHoje = vencemHoje.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -getSafeAmount(t.amount) : getSafeAmount(t.amount)), 0);
  const totalAVencer = aVencer.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -getSafeAmount(t.amount) : getSafeAmount(t.amount)), 0);
  
  // Total "A Pagar" = Vencidos + Vencem Hoje + A Vencer (todas as transações não pagas)
  const totalAPagar = totalVencidos + totalVencemHoje + totalAVencer;
  
  // Corrigindo o cálculo do saldo do período para incluir investimentos
  const saldoPeriodo = totalReceitas - totalDespesas - totalInvestimentos;

  // Calcular totais dos registros selecionados
  const selectedTransactionsData = transactions.filter(t => t.id && selectedTransactions.includes(t.id));
  const totalSelectedCount = selectedTransactionsData.length;
  const totalSelectedValue = selectedTransactionsData.reduce((sum, t) => {
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = t.is_paid || t.payment_status_id === 2;
    if (t.transaction_type === 'Despesa') return sum - getSafeAmount(t.amount);
    if (t.transaction_type === 'Investimento') return sum - getSafeAmount(t.amount);
    return sum + getSafeAmount(t.amount);
  }, 0);
  const totalSelectedReceitas = selectedTransactionsData.filter(t => t.transaction_type === 'Receita').reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
  const totalSelectedDespesas = selectedTransactionsData.filter(t => t.transaction_type === 'Despesa').reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
  const totalSelectedInvestimentos = selectedTransactionsData.filter(t => t.transaction_type === 'Investimento').reduce((sum, t) => sum + getSafeAmount(t.amount), 0);

  // Configurar centro de custo padrão quando usuário for carregado
  useEffect(() => {
    if (user?.cost_center_id && filters.cost_center_id.length === 0) {
      setFilters(prev => ({
        ...prev,
        cost_center_id: [user.cost_center_id!.toString()]
      }));
    }
  }, [user?.cost_center_id]);

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
        creation_date: formatDateToLocal(new Date()),
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
        dateFilterType,
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => {
          // Tratar filtros de array e payment_status_id separadamente
          if (key === 'payment_status_id' || key === 'transaction_type' || key === 'contact_id' || key === 'category_id') {
            return false; // Não incluir nos parâmetros da URL (serão aplicados no frontend)
          }
          return value !== '';
        }))
      };
      
      // Incluir filtro de centro de custo na API para garantir totalizadores corretos
      if (filters.cost_center_id.length > 0) {
        baseParams.cost_center_id = filters.cost_center_id.join(',');
      }
      
      // Adicionar parâmetros específicos de acordo com o tipo de filtro de data
      if (dateFilterType === 'month') {
        baseParams.month = currentDate.getMonth();
        baseParams.year = currentDate.getFullYear();
      } else if (dateFilterType === 'year') {
        baseParams.year = selectedYear;
      } else if (dateFilterType === 'custom' && customStartDate && customEndDate) {
        baseParams.customStartDate = format(customStartDate, 'yyyy-MM-dd');
        baseParams.customEndDate = format(customEndDate, 'yyyy-MM-dd');
      }
      
      // Adicionar parâmetros de data apenas se não for "Todo o período"
      if (dateFilterType !== 'all' && startDate && endDate) {
        baseParams.start_date = startDate;
        baseParams.end_date = endDate;
      }
      
      const params = new URLSearchParams(baseParams);
      
      console.log('Enviando requisição para /api/transactions/filtered com os parâmetros:', params.toString());
      
      const response = await api.get(`/transactions/filtered?${params}`);
      console.log("Resposta da API recebida:", response.data);
      console.log("Primeiras 3 transações - tipos:", response.data.slice(0, 3).map((t: any) => ({ id: t.id, type: t.type, transaction_type: t.transaction_type })));
      
      // ***** VERSÃO SIMPLIFICADA PARA TOTALIZADORES *****
      
      // 1. Buscar transações do período atual (para lista e totalizadores)
      const periodTransactions = response.data;
      
      // 2. Buscar TODAS as transações para filtrar vencidas
      let allTransactionsParams = 'dateFilterType=all';
      if (filters.cost_center_id.length > 0) {
        allTransactionsParams += `&cost_center_id=${filters.cost_center_id.join(',')}`;
      }
      const allTransactionsForOverdue = await api.get(`/transactions/filtered?${allTransactionsParams}`);
      
      // 3. Filtrar apenas vencidas (antes de hoje E não pagas)
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const overdueTransactionsFiltered = allTransactionsForOverdue.data.filter((t: any) => {
        const transactionDate = getSafeDate(t.transaction_date);
        transactionDate.setHours(0, 0, 0, 0);
        const isPaid = t.is_paid || t.payment_status_id === 2;
        // Incluir apenas se: data < hoje E não está pago
        return transactionDate < todayDate && !isPaid;
      });
      
      // 4. Combinar período + vencidas para totalizadores (evitando duplicatas)
      const combinedForTotals = [...periodTransactions];
      overdueTransactionsFiltered.forEach((overdueTransaction: any) => {
        if (!combinedForTotals.some((t: any) => t.id === overdueTransaction.id)) {
          combinedForTotals.push(overdueTransaction);
        }
      });
      
      // 5. Mapear para formato esperado pelo frontend
      const mappedCombined = combinedForTotals.map((transaction: any) => ({
        ...transaction,
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
          id: transaction.cost_center_id,
          name: transaction.cost_center_name,
          number: transaction.cost_center_number
        } : null,
        is_paid: transaction.is_paid,
        transaction_type: transaction.transaction_type || 
          (transaction.type === 'income' ? 'Receita' : 
           transaction.type === 'expense' ? 'Despesa' : 'Investimento'),
        is_installment: transaction.is_installment || false,
        installment_number: transaction.installment_number || null,
        total_installments: transaction.total_installments || null,
        original_cost_center_id: transaction.cost_center_id,
        original_contact_id: transaction.contact_id
      }));
      
      // DEBUG: Verificar os totais
      const debugReceitas = mappedCombined.filter(t => t.transaction_type === 'Receita').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const debugDespesas = mappedCombined.filter(t => t.transaction_type === 'Despesa').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const debugInvestimentos = mappedCombined.filter(t => t.transaction_type === 'Investimento').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      console.log("=== TOTALIZADORES SIMPLIFICADOS ===");
      console.log("Período:", periodTransactions.length, "transações");
      console.log("Vencidas:", overdueTransactionsFiltered.length, "transações");
      console.log("Combined:", mappedCombined.length, "transações");
      console.log("Receitas:", debugReceitas);
      console.log("Despesas:", debugDespesas);
      console.log("Investimentos:", debugInvestimentos);
      console.log("Saldo:", debugReceitas - debugDespesas - debugInvestimentos);
      
      // 6. Definir estados
      setAllTransactions(mappedCombined); // Para totalizadores
      setOverdueTransactionsForTotals(overdueTransactionsFiltered); // Para outras funções
      
      // ***** FIM DA VERSÃO SIMPLIFICADA *****

      // Aplicar filtros no frontend
      let filteredTransactions = response.data;
      
      // Filtro de status de pagamento
      if (filters.payment_status_id.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => {
          // Para manter consistência entre ambientes, verificar ambos os campos
          const isPaid = t.is_paid || t.payment_status_id === 2;
          const isUnpaid = !t.is_paid && t.payment_status_id !== 2;
          
          if (filters.payment_status_id.includes('paid')) {
            if (isPaid) return true;
          }
          
          if (filters.payment_status_id.includes('unpaid')) {
            if (isUnpaid) return true;
          }
          
          if (filters.payment_status_id.includes('overdue')) {
            // Para registros vencidos, verificar data < hoje e não pago
            // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
            const isPaid = t.is_paid || t.payment_status_id === 2;
            const transactionDate = getSafeDate(t.transaction_date);
            transactionDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (!isPaid && transactionDate < today) return true;
          }
          
          if (filters.payment_status_id.includes('cancelled')) {
            // Verificar status de cancelamento
            if (t.payment_status_id === 3 || !t.is_paid) return true; // Assumindo que cancelado = não pago
          }
          
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

      // Filtro de subcategoria
      if (filters.subcategory_id) {
        filteredTransactions = filteredTransactions.filter((t: any) => 
          t.subcategory_id === filters.subcategory_id
        );
      }
      
      // Sempre incluir registros vencidos (data < hoje e em aberto), independentemente dos filtros de data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Buscar registros vencidos separadamente apenas se o filtro incluir 'overdue'
      let overdueTransactions: any[] = [];
      
      if (filters.payment_status_id.length === 0 || filters.payment_status_id.includes('overdue')) {
      
        const overdueParams = { ...baseParams };
        // Remover filtros de data para buscar todos os vencidos
        delete overdueParams.start_date;
        delete overdueParams.end_date;
        delete overdueParams.month;
        delete overdueParams.year;
        delete overdueParams.customStartDate;
        delete overdueParams.customEndDate;
        overdueParams.dateFilterType = 'all'; // Buscar todas as datas para encontrar vencidos
        
        try {
          const overdueResponse = await api.get(`/transactions/filtered?${new URLSearchParams(overdueParams)}`);
          
          // Filtrar apenas transações vencidas (data < hoje) e não pagas
          // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
          overdueTransactions = overdueResponse.data.filter((t: any) => {
            const isPaid = t.is_paid || t.payment_status_id === 2;
            const transactionDate = getSafeDate(t.transaction_date);
            transactionDate.setHours(0, 0, 0, 0);
            return !isPaid && transactionDate < today;
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
          
          // Filtro de status de pagamento - aplicar também aos vencidos
          if (filters.payment_status_id.length > 0) {
            overdueTransactions = overdueTransactions.filter((t: any) => {
              // Para registros vencidos, verificar se 'overdue' ou 'unpaid' estão nos filtros
              // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
              const isPaid = t.is_paid || t.payment_status_id === 2;
              return (filters.payment_status_id.includes('overdue') || filters.payment_status_id.includes('unpaid')) && 
                     !isPaid; // Garantir que registros vencidos não estão pagos
            });
          } else {
            // Se não houver filtro de status, mostrar apenas vencidos não pagos
            // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
            overdueTransactions = overdueTransactions.filter((t: any) => {
              const isPaid = t.is_paid || t.payment_status_id === 2;
              return !isPaid;
            });
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
        // Converter o campo is_paid baseado no payment_status_id
        is_paid: transaction.is_paid,
        // Campos de parcelamento
        is_installment: transaction.is_installment || false,
        installment_number: transaction.installment_number || null,
        total_installments: transaction.total_installments || null,
        // Manter os IDs originais para edição
        original_cost_center_id: transaction.cost_center_id,
        original_contact_id: transaction.contact_id
      })));
      
      // Definir TODAS as transações (sem filtros) para cálculo de totalizadores
      // setAllTransactions(allTransactionsResponse.data.map((transaction: any) => ({
      //   ...transaction,
      //   // Mapear os dados relacionados para o formato esperado pelo frontend
      //   contact: transaction.contact_name ? { 
      //     id: transaction.contact_id, 
      //     name: transaction.contact_name 
      //   } : null,
      //   category: transaction.category_name ? { 
      //     id: transaction.category_id, 
      //     name: transaction.category_name 
      //   } : null,
      //   subcategory: transaction.subcategory_name ? { 
      //     id: transaction.subcategory_id, 
      //     name: transaction.subcategory_name 
      //   } : null,
      //   cost_center: transaction.cost_center_name ? { 
      //     id: transaction.cost_center_id,
      //     name: transaction.cost_center_name,
      //     number: transaction.cost_center_number
      //   } : null,
      //   is_paid: transaction.is_paid,
      //   is_installment: transaction.is_installment || false,
      //   installment_number: transaction.installment_number || null,
      //   total_installments: transaction.total_installments || null,
      //   original_cost_center_id: transaction.cost_center_id,
      //   original_contact_id: transaction.contact_id
      // })));
      
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
      console.log('🔍 MonthlyControl: Iniciando loadFilterData...');
      
      console.log('🔍 MonthlyControl: Carregando dados em paralelo...');
      const [categoriesRes, subcategoriesRes, contactsRes, costCentersRes, paymentStatusesRes, bankAccountsRes] = await Promise.all([
        categoryService.list().then(data => { console.log('✅ Categories loaded:', data.length); return data; }),
        subcategoryService.list().then(data => { console.log('✅ Subcategories loaded:', data.length); return data; }),
        api.get('/contacts').then(res => { console.log('✅ Contacts loaded:', res.data.length); return res; }),
        costCenterService.list().then(data => { console.log('✅ Cost Centers loaded:', data.length); return data; }),
        api.get('/payment-statuses').then(res => { console.log('✅ Payment Statuses loaded:', res.data.length); return res; }),
        bankAccountBalanceService.getBankAccountsWithBalances().then(data => { console.log('✅ Bank Accounts loaded:', data.length); return data; })
      ]);
      
      console.log('🔍 MonthlyControl: Processando dados...');
      
      // Filtrar e mapear dados dos services (similar ao CashFlow)
      const processedCategories = categoriesRes.filter(cat => cat.id).map(cat => ({ 
        id: cat.id!, 
        name: cat.name, 
        source_type: cat.source_type 
      }));
      console.log('📊 Processed categories:', processedCategories.length);
      
      const processedSubcategories = subcategoriesRes.filter(sub => sub.id).map(sub => ({ 
        id: sub.id!, 
        name: sub.name, 
        category_id: sub.category_id 
      }));
      console.log('📊 Processed subcategories:', processedSubcategories.length);
      
      const processedCostCenters = costCentersRes.filter(cc => cc.id).map(cc => ({ 
        id: cc.id!, 
        name: cc.name, 
        number: cc.number 
      }));
      console.log('📊 Processed cost centers:', processedCostCenters.length);
      
      setCategories(processedCategories);
      setSubcategories(processedSubcategories);
      setContacts(contactsRes.data);
      setCostCenters(processedCostCenters);
      setPaymentStatuses(paymentStatusesRes.data);
      
      console.log('✅ MonthlyControl: Todos os dados carregados com sucesso!');
      
      // Calcular saldo inicial total de todas as contas bancárias
      const totalInitialBalance = bankAccountsRes.reduce((sum, account) => sum + (account.initial_balance || 0), 0);
      setInitialBankAccountsBalance(totalInitialBalance);
    } catch (error) {
      console.error('❌ MonthlyControl: Erro ao carregar dados dos filtros:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ MonthlyControl: Detalhes do erro Axios:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
      }
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
        : transactions.map(t => t.id).filter(id => id !== undefined) as number[]
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
      console.log('Duplicando transação com ID:', id);
      // Buscar dados da transação original
      const response = await api.get(`/transactions/${id}`);
      const original = response.data;
      // Remover id e ajustar datas se necessário
      const duplicated = {
        ...original,
        id: undefined,
        transaction_date: formatDateToLocal(new Date()), // data local corrigida
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
      transaction_date: formatDateToLocal(new Date()),
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

      // Usar o endpoint de batch edit ao invés de múltiplas requisições PATCH
      await api.post('/transactions/batch-edit', {
        transactionIds: selectedTransactions,
        updates: updateData
      });

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
            try {
              await transactionService.markAsPaid(transactionId, batchPaymentData);
            } catch (error) {
              console.error(`Erro ao marcar transação ${transactionId} como paga:`, error);
              throw error;
            }
          }
        });
        
        await Promise.all(batchPromises);
        showSnackbar(`${selectedTransactions.length} transações marcadas como pagas com sucesso!`, 'success');
        setSelectedTransactions([]); // Limpar seleção
      } else if (selectedTransactionForPayment?.id) {
        // Processar pagamento individual
        try {
          await transactionService.markAsPaid(selectedTransactionForPayment.id, paymentData);
          showSnackbar('Transação marcada como paga com sucesso!', 'success');
        } catch (error) {
          console.error('Erro ao marcar transação como paga:', error);
          throw error;
        }
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
      transaction_date: formatDateToLocal(new Date()),
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
    
    // Converter amount para número e formatar para o padrão brasileiro
    const numericAmount = parseFloat(transaction.amount.toString()) || 0;
    const formattedAmount = numericAmount.toFixed(2).replace('.', ',');
    
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

      console.log('Dados sendo enviados:', transactionData);

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
        aValue = getSafeDate(a.transaction_date);
        bValue = getSafeDate(b.transaction_date);
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
          // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
          const isPaid = transaction.is_paid || transaction.payment_status_id === 2;
          if (isPaid) return 3; // Pago
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
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = transaction.is_paid || transaction.payment_status_id === 2;
    if (isPaid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionDate = getSafeDate(transaction.transaction_date);
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate < today;
  };

  // Verificar se transação vence hoje
  const isTransactionDueToday = (transaction: Transaction) => {
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = transaction.is_paid || transaction.payment_status_id === 2;
    if (isPaid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionDate = getSafeDate(transaction.transaction_date);
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate.getTime() === today.getTime();
  };

  // Obter status da transação
  const getTransactionStatus = (transaction: Transaction) => {
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = transaction.is_paid || transaction.payment_status_id === 2;
    if (isPaid) return 'Pago';
    if (isTransactionOverdue(transaction)) return 'Vencido';
    return 'Em aberto';
  };

  // Obter cor do status
  const getStatusColor = (transaction: Transaction) => {
    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
    const isPaid = transaction.is_paid || transaction.payment_status_id === 2;
    if (isPaid) return { bg: '#e8f5e8', color: '#2e7d32', border: '#4caf50' };
    if (isTransactionOverdue(transaction)) return { bg: '#ffebee', color: '#d32f2f', border: '#f44336' };
    return { bg: '#fff3e0', color: '#f57c00', border: '#ff9800' };
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
          {/* Modern Header */}
          <ModernHeader
            title="Controle Mensal"
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    onClick={() => setCurrentDate(prev => subMonths(prev, 1))}
                    size="small"
                    sx={{ 
                      bgcolor: '#FFFFFF',
                      borderRadius: 1.5,
                      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                      '&:hover': { 
                        bgcolor: colors.gray[50],
                        boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.15)'
                      }
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  
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
                  
                  <IconButton 
                    onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
                    size="small"
                    sx={{ 
                      bgcolor: '#FFFFFF',
                      borderRadius: 1.5,
                      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                      '&:hover': { 
                        bgcolor: colors.gray[50],
                        boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.15)'
                      }
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
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
                      <ExpenseIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
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
                      <IncomeIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
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
                      <InvestmentIcon sx={{ fontSize: 16, color: '#1976d2' }} />
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
                    payment_status_id: ['unpaid', 'overdue'], // Manter filtros padrão
                    category_id: [],
                    subcategory_id: '',
                    contact_id: [],
                    cost_center_id: user?.cost_center_id ? [user.cost_center_id.toString()] : [] // Manter centro de custo do usuário
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
                          <Box sx={{ color: category.source_type === 'Despesa' ? '#d32f2f' : category.source_type === 'Receita' ? '#2e7d32' : '#1976d2' }}>
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
              title={isSingleDay && customStartDate ? "Saldo Previsto" : "Receitas do Mês"}
              value={formatCurrency(totalReceitas)}
              subtitle={isSingleDay && customStartDate ? `Até ${format(customStartDate, 'dd/MM/yyyy')}` : "Total de entradas"}
              icon={<TrendingUp sx={{ fontSize: 16 }} />}
              color="success"
              trend={{ value: 0, isPositive: true }}
            />
            
            <ModernStatsCard
              title={isSingleDay && customStartDate ? "Despesas até o Dia" : "Despesas do Mês"}
              value={formatCurrency(totalDespesas)}
              subtitle={isSingleDay && customStartDate ? `Até ${format(customStartDate, 'dd/MM/yyyy')}` : "Total de gastos"}
              icon={<TrendingDown sx={{ fontSize: 16 }} />}
              color="error"
              trend={{ value: 0, isPositive: false }}
            />
            
            <ModernStatsCard
              title={isSingleDay && customStartDate ? "Investimentos até o Dia" : "Investimentos"}
              value={formatCurrency(totalInvestimentos)}
              subtitle={isSingleDay && customStartDate ? `Até ${format(customStartDate, 'dd/MM/yyyy')}` : "Total investido"}
              icon={<ShowChart sx={{ fontSize: 16, color: '#3761E2' }} />}
              color="warning"
              trend={{ value: 0, isPositive: true }}
              iconBgColor="#E7F2FB"
            />
            
            <ModernStatsCard
              title="Vencidos"
              value={formatCurrency(Math.abs(totalVencidos))}
              subtitle="Pagamentos em atraso"
              icon={<UndoIcon sx={{ fontSize: 16 }} />}
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
              title="Saldo do Período"
              value={formatCurrency(saldoPeriodo)}
              icon={<AccountBalanceIcon sx={{ fontSize: 16 }} />}
              color={saldoPeriodo >= 0 ? 'success' : 'error'}
              trend={{ value: Math.abs((saldoPeriodo / 10000) * 100), isPositive: saldoPeriodo >= 0 }}
            />
          </Box>

          {/* Totalizador dos registros selecionados */}
          {selectedTransactions.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'primary.main',
              overflow: 'hidden',
              '& > *': {
                flex: '1 1 0',
                minWidth: 0
              }
            }}>
              {/* 1. Registros Selecionados */}
              <ModernStatsCard
                title="Registros Selecionados"
                value={`${totalSelectedCount} ${totalSelectedCount === 1 ? 'registro' : 'registros'}`}
                subtitle="Total selecionado"
                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                color="primary"
              />

              {/* 2. Receitas */}
              {totalSelectedReceitas > 0 && (
                <ModernStatsCard
                  title="Receitas"
                  value={formatCurrency(totalSelectedReceitas)}
                  subtitle="Selecionadas"
                  icon={<TrendingUp sx={{ fontSize: 16 }} />}
                  color="success"
                />
              )}

              {/* 3. Despesas */}
              {totalSelectedDespesas > 0 && (
                <ModernStatsCard
                  title="Despesas"
                  value={formatCurrency(totalSelectedDespesas)}
                  subtitle="Selecionadas"
                  icon={<TrendingDown sx={{ fontSize: 16 }} />}
                  color="error"
                />
              )}

              {/* 4. Investimentos - opcional */}
              {totalSelectedInvestimentos > 0 && (
                <ModernStatsCard
                  title="Investimentos"
                  value={formatCurrency(totalSelectedInvestimentos)}
                  subtitle="Selecionados"
                  icon={<ShowChart sx={{ fontSize: 16, color: '#3761E2' }} />}
                  color="warning"
                  iconBgColor="#E7F2FB"
                />
              )}

              {/* 5. Valor Total - com cores condicionais */}
              <ModernStatsCard
                title="Valor Total"
                value={
                  <span style={{ 
                    color: totalSelectedValue >= 0 ? colors.success[600] : colors.error[600],
                    fontWeight: 'bold'
                  }}>
                    {formatCurrency(totalSelectedValue)}
                  </span>
                }
                subtitle={totalSelectedValue >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                icon={<AccountBalanceWalletIcon sx={{ fontSize: 16 }} />}
                color={totalSelectedValue >= 0 ? 'success' : 'error'}
              />
            </Box>
          )}

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
                {sortedTransactions.filter(transaction => transaction.id).map((transaction) => {
                  const statusColors = getStatusColor(transaction);
                  const isOverdue = isTransactionOverdue(transaction);
                  const isDueToday = isTransactionDueToday(transaction);
                  
                  // Definir cor de fundo baseada no status da transação
                  const getRowBackgroundColor = () => {
                    if (selectedTransactions.includes(transaction.id!)) {
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
                    key={transaction.id!}
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
                        checked={selectedTransactions.includes(transaction.id!)}
                        onChange={() => handleSelectTransaction(transaction.id!)}
                      />
                    </TableCell>
                    
                    <TableCell sx={{ minWidth: 90 }}>
                      <Typography variant="body2">
                        {formatSafeDate(transaction.transaction_date)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        {/* Ícone específico por tipo de transação */}
                        <Box 
                          sx={{ 
                            p: 1,
                            mt: 0.25,
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 32,
                            height: 32,
                            bgcolor: transaction.transaction_type === 'Despesa' ? '#FFEBEE' : 
                                   transaction.transaction_type === 'Receita' ? '#E8F5E8' : 
                                   '#E3F2FD', // Azul mais claro para investimentos
                            color: transaction.transaction_type === 'Despesa' ? colors.error[600] : 
                                  transaction.transaction_type === 'Receita' ? colors.success[600] : 
                                  colors.primary[600],
                            flexShrink: 0
                          }}
                        >
                          {transaction.transaction_type === 'Despesa' && <TrendingDown sx={{ fontSize: 18, color: '#d32f2f' }} />}
                          {transaction.transaction_type === 'Receita' && <TrendingUp sx={{ fontSize: 18, color: '#2e7d32' }} />}
                          {transaction.transaction_type === 'Investimento' && <ShowChart sx={{ fontSize: 18, color: '#1976d2' }} />}
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
                        onClick={(e) => handleActionMenuOpen(e, transaction.id!)}
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
              </TableBody>
            </Table>
          </TableContainer>
          </Box>

        {/* Batch Actions Menu */}
        <Menu
          anchorEl={batchActionsAnchor}
          open={Boolean(batchActionsAnchor)}
          onClose={() => setBatchActionsAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <MenuItem onClick={handleBatchEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: colors.primary[600] }} />
            </ListItemIcon>
            <ListItemText>Editar em Lote</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleBatchMarkAsPaid}>
            <ListItemIcon>
              <PaidIcon fontSize="small" sx={{ color: colors.success[600] }} />
            </ListItemIcon>
            <ListItemText>Marcar como Pago</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleBatchReversePayment}>
            <ListItemIcon>
              <UndoIcon fontSize="small" sx={{ color: colors.warning[600] }} />
            </ListItemIcon>
            <ListItemText>Estornar em Lote</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={handleBatchDelete} 
            sx={{ color: colors.error[600] }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: colors.error[600] }} />
            </ListItemIcon>
            <ListItemText>Excluir Selecionados</ListItemText>
          </MenuItem>
        </Menu>

        {/* Menu de ações */}
        <Menu
          anchorEl={actionMenuAnchorEl}
          open={Boolean(actionMenuAnchorEl)}
          onClose={handleActionMenuClose}
        >
          <MenuItem onClick={() => {
            if (selectedTransactionId) {
              const transaction = transactions.find(t => t.id === selectedTransactionId);
              if (transaction) {
                handleEditTransaction(transaction);
              }
            }
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: colors.primary[600] }} />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => selectedTransactionId && handleDuplicateTransaction(selectedTransactionId)}>
            <ListItemIcon>
              <DuplicateIcon fontSize="small" sx={{ color: colors.primary[600] }} />
            </ListItemIcon>
            <ListItemText>Duplicar</ListItemText>
          </MenuItem>
          
          <MenuItem 
            onClick={() => selectedTransactionId && handleMarkAsPaid(selectedTransactionId)}
            disabled={(() => {
              const transaction = transactions.find(t => t.id === selectedTransactionId);
              // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
              return transaction ? (transaction.is_paid || transaction.payment_status_id === 2) : false;
            })()}
            sx={{
              opacity: (() => {
                const transaction = transactions.find(t => t.id === selectedTransactionId);
                // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
                return transaction ? (transaction.is_paid || transaction.payment_status_id === 2) ? 0.5 : 1 : 1;
              })()
            }}
          >
            <ListItemIcon>
              <PaidIcon 
                fontSize="small" 
                sx={{ 
                  color: (() => {
                    const transaction = transactions.find(t => t.id === selectedTransactionId);
                    // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
                    return transaction ? (transaction.is_paid || transaction.payment_status_id === 2) ? colors.gray[400] : colors.success[600] : colors.gray[400];
                  })() 
                }} 
              />
            </ListItemIcon>
            <ListItemText>Marcar como Pago</ListItemText>
          </MenuItem>
          
          <MenuItem 
            onClick={() => selectedTransactionId && handleReversePayment(selectedTransactionId)}
            disabled={(() => {
              const transaction = transactions.find(t => t.id === selectedTransactionId);
              return !transaction?.is_paid;
            })()}
            sx={{
              opacity: (() => {
                const transaction = transactions.find(t => t.id === selectedTransactionId);
                return !transaction?.is_paid ? 0.5 : 1;
              })()
            }}
          >
            <ListItemIcon>
              <RedoIcon fontSize="small" sx={{ color: colors.primary[600] }} />
            </ListItemIcon>
            <ListItemText>Reverter Pagamento</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => selectedTransactionId && handleDeleteTransaction(selectedTransactionId)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: colors.error[600] }} />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        </Menu>

        {/* Date Picker Dialog */}
        <Dialog open={datePickerOpen} onClose={() => setDatePickerOpen(false)}>
          <DialogTitle>Selecionar Mês</DialogTitle>
          <DialogContent>
            <DatePicker
              views={['year', 'month']}
              value={currentDate}
              onChange={(newValue) => {
                if (newValue) {
                  setCurrentDate(newValue);
                  setDatePickerOpen(false);
                }
              }}
              slotProps={{
                textField: { 
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDatePickerOpen(false)}>Cancelar</Button>
          </DialogActions>
        </Dialog>

        {/* Menu de nova transação */}
        <Menu
          anchorEl={newTransactionMenuAnchor}
          open={Boolean(newTransactionMenuAnchor)}
          onClose={() => setNewTransactionMenuAnchor(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            + Novo Registro
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => handleNewTransaction('Despesa')}
          >
            <ListItemIcon>
              <ExpenseIcon sx={{ color: '#d32f2f' }} />
            </ListItemIcon>
            <ListItemText>Despesa</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => handleNewTransaction('Receita')}
          >
            <ListItemIcon>
              <IncomeIcon sx={{ color: '#2e7d32' }} />
            </ListItemIcon>
            <ListItemText>Receita</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => handleNewTransaction('Investimento')}
          >
            <ListItemIcon>
              <InvestmentIcon sx={{ color: '#1976d2' }} />
            </ListItemIcon>
            <ListItemText>Investimento</ListItemText>
          </MenuItem>
        </Menu>

        {/* Date Picker Dialog */}
        <Dialog 
          open={transactionDialogOpen} 
          onClose={handleCloseTransactionDialog} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <form onSubmit={handleTransactionSubmit}>
            <DialogTitle sx={{ bgcolor: '#f8fafc', fontWeight: 'bold', color: '#1a365d' }}>
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                },
                gap: 2,
                mt: 0.5
              }}>
                {/* Primeira linha - 3 colunas */}
                <Box>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Tipo de Registro</InputLabel>
                    <Select
                      value={formData.transaction_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as any }))}
                      label="Tipo de Registro"
                    >
                      <MenuItem value="Despesa">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ExpenseIcon sx={{ color: '#d32f2f', mr: 1 }} />
                          Despesa
                        </Box>
                      </MenuItem>
                      <MenuItem value="Receita">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IncomeIcon sx={{ color: '#2e7d32', mr: 1 }} />
                          Receita
                        </Box>
                      </MenuItem>
                      <MenuItem value="Investimento">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <InvestmentIcon sx={{ color: '#1976d2', mr: 1 }} />
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
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box>
                  <TextField
                    label="Valor"
                    type="text"
                    value={formData.amount}
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
                    placeholder="0,00"
                    helperText="Use vírgula para decimais (ex: 1666,00)"
                  />
                </Box>

                {/* Segunda linha - Descrição */}
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Descrição da Transação"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    fullWidth
                    required
                    size="small"
                    multiline
                    rows={2}
                  />
                </Box>

                {/* Terceira linha - Filtros adicionais */}
                <Box sx={{ gridColumn: { xs: '1', sm: '1' } }}>
                  <Autocomplete
                    options={categories.filter(cat => cat.source_type === formData.transaction_type)}
                    getOptionLabel={(option) => option.name}
                    value={categories.find(cat => cat.id.toString() === formData.category_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        category_id: newValue?.id.toString() || '',
                        subcategory_id: '' // Reset subcategory when category changes
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Categoria"
                        size="small"
                        required
                      />
                    )}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '2' } }}>
                  <Autocomplete
                    options={subcategories.filter(sub => 
                      formData.category_id ? 
                      sub.category_id.toString() === formData.category_id : 
                      false
                    )}
                    getOptionLabel={(option) => option.name}
                    value={subcategories.find(sub => sub.id.toString() === formData.subcategory_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        subcategory_id: newValue?.id.toString() || ''
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Subcategoria"
                        size="small"
                      />
                    )}
                    disabled={!formData.category_id}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '1' } }}>
                  <Autocomplete
                    options={contacts}
                    getOptionLabel={(option) => option.name}
                    value={contacts.find(contact => contact.id.toString() === formData.contact_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        contact_id: newValue?.id.toString() || ''
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Contato"
                        size="small"
                        required
                      />
                    )}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '2' } }}>
                  <Autocomplete
                    options={costCenters}
                    getOptionLabel={(option) => option.number ? `${option.number} - ${option.name}` : option.name}
                    value={costCenters.find(cc => cc.id.toString() === formData.cost_center_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        cost_center_id: newValue?.id.toString() || ''
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Centro de Custo"
                        size="small"
                        required
                      />
                    )}
                  />
                </Box>

                {/* Quinta linha - Switches lado a lado */}
                <Box sx={{ gridColumn: '1 / -1' }}>
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
                          checked={formData.is_installment}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_installment: e.target.checked }))}
                          color="secondary"
                        />
                      }
                      label="Parcelado?"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_paid}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
                          color="success"
                        />
                      }
                      label="Já foi pago/recebido?"
                    />
                  </Box>
                </Box>

                {/* Campos de parcelamento */}
                {formData.is_installment && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
                      <TextField
                        label="Número de Parcelas"
                        type="number"
                        value={formData.total_installments}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Permitir campo vazio ou valores numéricos
                          if (value === '' || (!isNaN(parseInt(value)) && parseInt(value) >= 0)) {
                            setFormData(prev => ({ ...prev, total_installments: value === '' ? '' : parseInt(value) }));
                          }
                        }}
                        onBlur={(e) => {
                          // Quando sair do campo, se estiver vazio ou inválido, definir como 1
                          const value = e.target.value;
                          if (!value || parseInt(value) < 1) {
                            setFormData(prev => ({ ...prev, total_installments: 1 }));
                          }
                        }}
                        size="small"
                        sx={{ width: 200 }}
                        inputProps={{ min: 1, max: 360 }}
                        helperText="Máximo 360 parcelas"
                      />
                    </Box>
                  </Box>
                )}

                {/* Campos de recorrência */}
                {formData.is_recurring && (
                  <>
                    {/* Todos os campos de recorrência na mesma linha */}
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(4, 1fr)'
                        },
                        gap: 2
                      }}>
                        <Box>
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
                          <Box>
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
                          <Box>
                            <TextField
                              label="A cada quantos dias"
                              type="number"
                              value={formData.recurrence_interval || 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setFormData(prev => ({ ...prev, recurrence_interval: Math.max(1, Math.min(365, value)) }));
                              }}
                              onBlur={(e) => {
                                // Garantir que nunca fique vazio ou zero
                                if (!e.target.value || parseInt(e.target.value) < 1) {
                                  setFormData(prev => ({ ...prev, recurrence_interval: 1 }));
                                }
                              }}
                              fullWidth
                              size="small"
                              inputProps={{ min: 1, max: 365 }}
                            />
                          </Box>
                        )}
                        
                        {/* Quantidade de Vezes sempre visível */}
                        <Box>
                          <TextField
                            label="Quantidade de Vezes"
                            type="number"
                            value={formData.recurrence_count}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Permitir campo vazio ou valores numéricos
                              if (value === '' || (!isNaN(parseInt(value)) && parseInt(value) >= 0)) {
                                setFormData(prev => ({ ...prev, recurrence_count: value === '' ? '' : parseInt(value) }));
                              }
                            }}
                            onBlur={(e) => {
                              // Quando sair do campo, se estiver vazio ou inválido, definir como 2
                              const value = e.target.value;
                              if (!value || parseInt(value) < 1) {
                                setFormData(prev => ({ ...prev, recurrence_count: 2 }));
                              }
                            }}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 60 }}
                          />
                        </Box>
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
                            <TableCell>{getSafeDate(item.creation_date).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{getSafeDate(item.due_date).toLocaleDateString('pt-BR')}</TableCell>
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
              <Button onClick={handleCloseTransactionDialog} variant="outlined">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
              >
                {editingTransaction ? 'Atualizar' : 'Criar'} Transação
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={7000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            variant="filled"
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

        {/* Dialog para edição em lote */}
        <Dialog
          open={batchEditDialogOpen}
          onClose={() => setBatchEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: colors.primary[50], color: colors.primary[700] }}>
            Edição em Lote
            <Typography variant="body2" sx={{ color: colors.gray[600], mt: 0.5 }}>
              {selectedTransactions.length} transação(ões) selecionada(s)
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ mb: 3, color: colors.gray[600] }}>
              Preencha apenas os campos que deseja alterar. Os campos vazios não serão modificados.
            </Typography>
            
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3
            }}>
              {/* Descrição */}
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <TextField
                  label="Descrição"
                  value={batchEditData.description}
                  onChange={(e) => setBatchEditData(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="Deixe vazio para não alterar"
                  helperText="Nova descrição para as transações selecionadas"
                  multiline
                  rows={2}
                />
              </Box>

              {/* Valor */}
              <TextField
                label="Valor (R$)"
                type="text"
                value={batchEditData.amount}
                onChange={(e) => {
                  // Permite apenas números, vírgula e ponto
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setBatchEditData(prev => ({ ...prev, amount: value }));
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
                      setBatchEditData(prev => ({ ...prev, amount: formattedValue }));
                    }
                  }
                }}
                onFocus={(e) => {
                  // Converter para formato de edição (sem formatação de milhares)
                  const value = e.target.value;
                  if (value) {
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
                    
                    const numericValue = parseBrazilianNumber(value);
                    if (!isNaN(numericValue)) {
                      // Converte para formato editável (sem pontos de milhar)
                      const editableValue = numericValue.toFixed(2).replace('.', ',');
                      setBatchEditData(prev => ({ ...prev, amount: editableValue }));
                    }
                  }
                }}
                fullWidth
                size="small"
                placeholder="Deixe vazio para não alterar"
                helperText="Use vírgula para decimais (ex: 150,00)"
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1 }}>R$</Box>
                }}
              />

              {/* Data de Vencimento */}
              <TextField
                label="Data de Vencimento"
                type="date"
                value={batchEditData.transaction_date}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, transaction_date: e.target.value }))}
                fullWidth
                size="small"
                placeholder="Deixe vazio para não alterar"
                helperText="Nova data de vencimento"
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {/* Contato */}
              <FormControl fullWidth size="small">
                <InputLabel>Contato</InputLabel>
                <Select
                  value={batchEditData.contact_id}
                  onChange={(e) => setBatchEditData(prev => ({ ...prev, contact_id: e.target.value }))}
                  label="Contato"
                >
                  <MenuItem value="">
                    <em>Não alterar</em>
                  </MenuItem>
                  {contacts.map((contact) => (
                    <MenuItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Categoria */}
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={batchEditData.category_id}
                  onChange={(e) => {
                    setBatchEditData(prev => ({ 
                      ...prev, 
                      category_id: e.target.value,
                      // Limpar subcategoria quando categoria muda
                      subcategory_id: ''
                    }));
                  }}
                  label="Categoria"
                >
                  <MenuItem value="">
                    <em>Não alterar</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: category.source_type === 'Despesa' ? '#d32f2f' : category.source_type === 'Receita' ? '#2e7d32' : '#1976d2' }}>
                          {category.source_type === 'Despesa' && <ExpenseIcon sx={{ fontSize: 16 }} />}
                          {category.source_type === 'Receita' && <IncomeIcon sx={{ fontSize: 16 }} />}
                          {category.source_type === 'Investimento' && <InvestmentIcon sx={{ fontSize: 16 }} />}
                        </Box>
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Subcategoria - Condicionada à categoria selecionada */}
              <FormControl fullWidth size="small">
                <InputLabel>Subcategoria</InputLabel>
                <Select
                  value={batchEditData.subcategory_id}
                  onChange={(e) => {
                    setBatchEditData(prev => ({ 
                      ...prev, 
                      subcategory_id: e.target.value
                    }));
                  }}
                  label="Subcategoria"
                  disabled={!batchEditData.category_id || batchEditData.category_id === ''}
                >
                  <MenuItem value="">
                    <em>{!batchEditData.category_id || batchEditData.category_id === '' ? 'Selecione uma categoria primeiro' : 'Não alterar'}</em>
                  </MenuItem>
                  {subcategories
                    .filter(sub => {
                      // Se nenhuma categoria específica está selecionada, não mostrar subcategorias
                      if (!batchEditData.category_id || batchEditData.category_id === '') {
                        return false;
                      }
                      // Se categoria está selecionada, filtrar subcategorias por essa categoria
                      return sub.category_id.toString() === batchEditData.category_id;
                    })
                    .map((subcategory) => (
                      <MenuItem key={subcategory.id} value={subcategory.id.toString()}>
                        {subcategory.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              {/* Centro de Custo */}
              <FormControl fullWidth size="small">
                <InputLabel>Centro de Custo</InputLabel>
                <Select
                  value={batchEditData.cost_center_id}
                  onChange={(e) => setBatchEditData(prev => ({ ...prev, cost_center_id: e.target.value }))}
                  label="Centro de Custo"
                >
                  <MenuItem value="">
                    <em>Não alterar</em>
                  </MenuItem>
                  {costCenters.map((costCenter) => (
                    <MenuItem key={costCenter.id} value={costCenter.id}>
                      {costCenter.number ? `${costCenter.number} - ${costCenter.name}` : costCenter.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setBatchEditDialogOpen(false)}
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmBatchEdit}
              variant="contained"
              disabled={loading}
            >
              Atualizar {selectedTransactions.length} Transação(ões)
            </Button>
          </DialogActions>
        </Dialog>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
