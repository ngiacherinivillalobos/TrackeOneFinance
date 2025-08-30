import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { HeaderSection } from './HeaderSection';
import { StatsSection } from './StatsSection';
import { FiltersSection } from './FiltersSection';
import { TransactionsTable } from './TransactionsTable';
import api from '../../services/api';

// Interfaces
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

export const MonthlyControlMain: React.FC = () => {
  console.log('MonthlyControlMain component mounting...');
  const { user } = useAuth();
  
  // Responsividade
  const theme = useTheme();
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  
  // Estados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estados para filtros
  const [filters, setFilters] = useState<Filters>({
    transaction_type: [],
    payment_status_id: [],
    category_id: [],
    subcategory_id: '',
    contact_id: [],
    cost_center_id: []
  });
  
  // Estados para dados dos filtros
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  
  // Estados para seleção e ações
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState<boolean>(false);
  
  // Estados de notificação
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Estados para ordenação
  const [orderBy, setOrderBy] = useState<string>('transaction_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Cálculo dos totais e status de vencimento (otimizado com useMemo)
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const totalReceitas = useMemo(() => {
    return transactions
      .filter(t => t.transaction_type === 'Receita')
      .reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
  }, [transactions]);
    
  const totalDespesas = useMemo(() => {
    return transactions
      .filter(t => t.transaction_type === 'Despesa')
      .reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
  }, [transactions]);

  // Cálculos dos totalizadores (otimizados com useMemo)
  const vencidos = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date + 'T00:00:00');
      transactionDate.setHours(0, 0, 0, 0);
      return !t.is_paid && transactionDate < today;
    });
  }, [transactions, today]);

  const vencemHoje = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date + 'T00:00:00');
      transactionDate.setHours(0, 0, 0, 0);
      return !t.is_paid && transactionDate.getTime() === today.getTime();
    });
  }, [transactions, today]);

  const aVencer = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date + 'T00:00:00');
      transactionDate.setHours(0, 0, 0, 0);
      return !t.is_paid && transactionDate > today;
    });
  }, [transactions, today]);

  const totalVencidos = useMemo(() => {
    return vencidos.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      const validatedAmount = isNaN(amount) ? 0 : amount;
      return sum + (t.transaction_type === 'Despesa' ? -validatedAmount : validatedAmount);
    }, 0);
  }, [vencidos]);
  
  const totalVencemHoje = useMemo(() => {
    return vencemHoje.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      const validatedAmount = isNaN(amount) ? 0 : amount;
      return sum + (t.transaction_type === 'Despesa' ? -validatedAmount : validatedAmount);
    }, 0);
  }, [vencemHoje]);
  
  const totalAVencer = useMemo(() => {
    return aVencer.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      const validatedAmount = isNaN(amount) ? 0 : amount;
      return sum + (t.transaction_type === 'Despesa' ? -validatedAmount : validatedAmount);
    }, 0);
  }, [aVencer]);
  
  const saldoPeriodo = useMemo(() => {
    return totalReceitas - totalDespesas;
  }, [totalReceitas, totalDespesas]);

  // Funções utilitárias
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadFilterData();
    loadTransactions();
  }, []);

  // Carregar transações quando os filtros mudarem
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadFilterData = async () => {
    try {
      const [categoriesRes, subcategoriesRes, contactsRes, costCentersRes, paymentStatusesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
        api.get('/contacts'),
        api.get('/cost-centers'),
        api.get('/payment-statuses')
      ]);
      
      setCategories(categoriesRes.data || []);
      setSubcategories(subcategoriesRes.data || []);
      setContacts(contactsRes.data || []);
      setCostCenters(costCentersRes.data || []);
      setPaymentStatuses(paymentStatusesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
      showSnackbar('Erro ao carregar filtros', 'error');
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Preparar parâmetros de filtro
      const baseParams: any = {};
      
      // Adicionar filtro de centro de custo do usuário se não houver filtro específico
      if (filters.cost_center_id.length === 0 && user?.cost_center_id) {
        baseParams.cost_center_id = user.cost_center_id;
      } else if (filters.cost_center_id.length > 0) {
        baseParams.cost_center_id = filters.cost_center_id[0];
      }
      
      // Adicionar outros filtros
      if (filters.transaction_type.length > 0) {
        baseParams.transaction_type = filters.transaction_type.join(',');
      }
      
      if (filters.payment_status_id.length > 0) {
        baseParams.payment_status_id = filters.payment_status_id.join(',');
      }
      
      if (filters.category_id.length > 0) {
        baseParams.category_id = filters.category_id.join(',');
      }
      
      if (filters.subcategory_id) {
        baseParams.subcategory_id = filters.subcategory_id;
      }
      
      if (filters.contact_id.length > 0) {
        baseParams.contact_id = filters.contact_id.join(',');
      }
      
      const params = new URLSearchParams(baseParams);
      const response = await api.get(`/transactions?${params}`);
      
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      showSnackbar('Erro ao carregar transações', 'error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      transaction_type: [],
      payment_status_id: [],
      category_id: [],
      subcategory_id: '',
      contact_id: [],
      cost_center_id: []
    });
  };

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

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, transactionId: number) => {
    console.log('Abrir menu de ações para transação:', transactionId);
  };

  const handleOpenNewTransaction = () => {
    console.log('Abrir modal de nova transação');
  };

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Log para verificar se o componente está sendo renderizado
  useEffect(() => {
    console.log('MonthlyControlMain component rendered');
    return () => {
      console.log('MonthlyControlMain component unmounting');
    };
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        {/* Cabeçalho */}
        <HeaderSection
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          handleOpenNewTransaction={handleOpenNewTransaction}
          isMediumScreen={isMediumScreen}
        />

        {/* Totalizadores */}
        <StatsSection
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          totalVencidos={totalVencidos}
          totalVencemHoje={totalVencemHoje}
          totalAVencer={totalAVencer}
          saldoPeriodo={saldoPeriodo}
          formatCurrency={formatCurrency}
        />

        {/* Filtros */}
        <FiltersSection
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          subcategories={subcategories}
          contacts={contacts}
          costCenters={costCenters}
          paymentStatuses={paymentStatuses}
          handleClearFilters={handleClearFilters}
          moreFiltersOpen={moreFiltersOpen}
          setMoreFiltersOpen={setMoreFiltersOpen}
        />

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Erro */}
        {!loading && transactions.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Nenhuma transação encontrada. Tente ajustar os filtros ou adicione uma nova transação.
          </Alert>
        )}

        {/* Tabela de transações */}
        {!loading && transactions.length > 0 && (
          <TransactionsTable
            transactions={transactions}
            selectedTransactions={selectedTransactions}
            handleSelectTransaction={handleSelectTransaction}
            handleSelectAllTransactions={handleSelectAllTransactions}
            handleActionMenuOpen={handleActionMenuOpen}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            orderBy={orderBy}
            order={order}
            handleSort={handleSort}
          />
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
        />

        {/* Botão flutuante */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={handleOpenNewTransaction}
        >
          <AddIcon />
        </Fab>
      </Box>
    </LocalizationProvider>
  );
};