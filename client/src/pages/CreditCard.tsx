import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Checkbox,
  useMediaQuery,
  useTheme,
  IconButton,
  TablePagination,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterIcon from '@mui/icons-material/FilterAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { ModernHeader, ModernCard } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';
import { cardService, Card as CardType } from '../services/cardService';
import { cardTransactionService, CardTransaction } from '../services/cardTransactionService';
import { categoryService, Category } from '../services/categoryService';
import { subcategoryService, Subcategory } from '../services/subcategoryService';
import { transactionService } from '../services/transactionService';
import { CreditCardTransactionForm } from '../components/CreditCardTransactionForm';

interface CreditCard extends CardType {
  type?: string;
  limit_amount?: string;
  closing_day?: number;
  due_day?: number;
}

interface Filters {
  month: Date;
  cardId: string;
  categoryId: string[];
  subcategoryId: string;
}

// Adicionar novos estados para os filtros avançados
interface AdvancedFilters {
  dateFilterType: 'month' | 'year' | 'custom' | 'all';
  customStartDate: Date | null;
  customEndDate: Date | null;
  selectedYear: number;
}

export default function CreditCard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [batchActionsAnchor, setBatchActionsAnchor] = useState<HTMLElement | null>(null);
  
  // Adicionar estados para edição em lote
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [batchEditData, setBatchEditData] = useState({
    description: '',
    amount: '',
    transaction_date: '',
    category_id: '',
    subcategory_id: '',
    card_id: ''
  });
  
  // Estados para filtros
  const [filters, setFilters] = useState<Filters>({
    month: new Date(),
    cardId: '',
    categoryId: [],
    subcategoryId: '',
  });
  
  // Estados para filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateFilterType: 'month',
    customStartDate: null,
    customEndDate: null,
    selectedYear: new Date().getFullYear(),
  });
  
  // Estados para dados dos filtros
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  // Estados de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Adicionar menu de ações individuais
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, transactionId: number) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedTransactionId(null);
  };
  
  // Estados para ordenação
  const [orderBy, setOrderBy] = useState<string>('transaction_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
  // Carregar dados para filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [categoriesData, subcategoriesData] = await Promise.all([
          categoryService.list(),
          subcategoryService.list()
        ]);
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };
    
    loadFilterData();
  }, []);

  // Função para criar transação automática no controle mensal
  const createAutomaticTransaction = async (cardId: number, month: Date, totalAmount: number) => {
    try {
      // Obter informações do cartão para a data de vencimento
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        console.error('Cartão não encontrado');
        return;
      }

      // Calcular a data de vencimento baseada no dia de vencimento do cartão
      const dueDate = new Date(month.getFullYear(), month.getMonth(), card.due_day || 10);
      
      // Dados para a transação automática
      const automaticTransactionData = {
        description: "Criação Automática de Fatura do Cartão de Crédito",
        amount: totalAmount,
        transaction_type: 'Despesa' as 'Despesa' | 'Receita' | 'Investimento',
        category_id: 1, // Categoria "Cartão de Crédito" (você pode ajustar conforme necessário)
        transaction_date: dueDate.toISOString().split('T')[0],
        is_recurring: false,
        is_paid: false,
        payment_status_id: 1 // Em aberto
      };

      // Criar a transação automática
      await transactionService.create(automaticTransactionData);
      console.log('Transação automática criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar transação automática:', error);
    }
  };

  // Função para carregar transações com filtros
  const loadTransactions = async () => {
    try {
      setLoading(true);
      console.log('Carregando transações com filtros:', filters);
      
      // Preparar parâmetros de filtro
      const filterParams: any = {};
      
      // Apenas aplicar filtros de data se não for "Todo o período"
      if (advancedFilters.dateFilterType !== 'all') {
        let startDate: string | undefined;
        let endDate: string | undefined;
        
        if (advancedFilters.dateFilterType === 'month') {
          startDate = format(startOfMonth(filters.month), 'yyyy-MM-dd');
          endDate = format(endOfMonth(filters.month), 'yyyy-MM-dd');
        } else if (advancedFilters.dateFilterType === 'year') {
          startDate = `${advancedFilters.selectedYear}-01-01`;
          endDate = `${advancedFilters.selectedYear}-12-31`;
        } else if (advancedFilters.dateFilterType === 'custom' && advancedFilters.customStartDate && advancedFilters.customEndDate) {
          startDate = format(advancedFilters.customStartDate, 'yyyy-MM-dd');
          endDate = format(advancedFilters.customEndDate, 'yyyy-MM-dd');
        }
        
        if (startDate && endDate) {
          filterParams.start_date = startDate;
          filterParams.end_date = endDate;
        }
      }
      
      if (filters.cardId) {
        filterParams.card_id = filters.cardId;
      }
      
      if (filters.categoryId.length > 0) {
        filterParams.category_id = filters.categoryId.join(',');
      }
      
      if (filters.subcategoryId) {
        filterParams.subcategory_id = filters.subcategoryId;
      }
      
      // Carregar transações filtradas
      const transactionsData = await cardTransactionService.getFiltered(filterParams);
      console.log('Transações carregadas:', transactionsData);
      console.log('Número de transações carregadas:', transactionsData.length);
      setTransactions(transactionsData);
      setSelectedTransactions([]); // Limpar seleção ao recarregar
      
      // Criar transações automáticas se houver transações de cartão
      if (transactionsData.length > 0 && advancedFilters.dateFilterType === 'month') {
        // Agrupar transações por cartão
        const transactionsByCard: { [key: number]: CardTransaction[] } = {};
        
        transactionsData.forEach(transaction => {
          if (transaction.card_id) {
            if (!transactionsByCard[transaction.card_id]) {
              transactionsByCard[transaction.card_id] = [];
            }
            transactionsByCard[transaction.card_id].push(transaction);
          }
        });
        
        // Criar transação automática para cada cartão com transações
        for (const cardId in transactionsByCard) {
          const cardTransactions = transactionsByCard[parseInt(cardId)];
          const totalAmount = cardTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
          
          // Criar transação automática no controle mensal
          await createAutomaticTransaction(parseInt(cardId), filters.month, totalAmount);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar transações quando os filtros mudarem
  useEffect(() => {
    loadTransactions();
  }, [filters, advancedFilters]);

  // Função para lidar com o envio do formulário
  const handleTransactionSubmit = () => {
    // Recarregar dados após salvar transação
    loadTransactions();
    // Limpar transação em edição
    setEditingTransaction(null);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const cardsData = await cardService.list();
        console.log('Cartões carregados:', cardsData);
        // Mapear os dados para o formato esperado pelo frontend
        const mappedCards = cardsData.map(card => ({
          ...card,
          type: card.brand || 'Crédito',
          limit_amount: '0'
          // Remover os valores fixos e usar os valores reais do backend
          // closing_day: 15,
          // due_day: 10
        }));
        console.log('Cartões mapeados:', mappedCards);
        setCards(mappedCards);
        
        // Não selecionar automaticamente o primeiro cartão
        // Manter o filtro como "Todos os cartões" por padrão
      } catch (error) {
        console.error('Error loading cards:', error);
      }
    };
    
    loadData();
  }, []);

  // Funções para manipulação de filtros
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdvancedFilterChange = (name: string, value: any) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      month: new Date(),
      cardId: '',
      categoryId: [],
      subcategoryId: '',
    });
    setAdvancedFilters({
      dateFilterType: 'month',
      customStartDate: null,
      customEndDate: null,
      selectedYear: new Date().getFullYear(),
    });
  };

  // Funções para seleção de transações
  const handleSelectAllTransactions = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = transactions.map((transaction) => transaction.id!);
      setSelectedTransactions(newSelected);
      return;
    }
    setSelectedTransactions([]);
  };

  const handleSelectTransaction = (id: number) => {
    const selectedIndex = selectedTransactions.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedTransactions, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedTransactions.slice(1));
    } else if (selectedIndex === selectedTransactions.length - 1) {
      newSelected = newSelected.concat(selectedTransactions.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedTransactions.slice(0, selectedIndex),
        selectedTransactions.slice(selectedIndex + 1),
      );
    }

    setSelectedTransactions(newSelected);
  };

  // Funções para edição e exclusão
  const handleEditTransaction = (transaction: CardTransaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await cardTransactionService.delete(id);
        loadTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Erro ao excluir transação');
      }
    }
  };

  // Funções para ações em lote
  const handleBatchDelete = async () => {
    if (selectedTransactions.length === 0) return;
    
    if (window.confirm(`Tem certeza que deseja excluir ${selectedTransactions.length} transação(ões) selecionada(s)?`)) {
      try {
        await Promise.all(
          selectedTransactions.map(id => cardTransactionService.delete(id))
        );
        setSelectedTransactions([]);
        loadTransactions();
      } catch (error) {
        console.error('Error deleting transactions:', error);
        alert('Erro ao excluir transações');
      }
    }
    setBatchActionsAnchor(null);
  };

  // Função para lidar com a edição em lote
  const handleBatchEdit = () => {
    if (selectedTransactions.length === 0) return;
    
    // Limpar dados do formulário de edição em lote
    setBatchEditData({
      description: '',
      amount: '',
      transaction_date: '',
      category_id: '',
      subcategory_id: '',
      card_id: ''
    });
    
    setBatchEditDialogOpen(true);
    setBatchActionsAnchor(null);
  };

  // Adicionar função para confirmar edição em lote
  const handleConfirmBatchEdit = async () => {
    if (selectedTransactions.length === 0) return;
    
    setLoading(true);
    
    try {
      // Preparar dados para atualização (remover campos vazios)
      const updateData: any = {};
      
      if (batchEditData.description) {
        updateData.description = batchEditData.description;
      }
      
      if (batchEditData.amount) {
        // Converter valor formatado para número
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
        updateData.amount = parseBrazilianNumber(batchEditData.amount);
      }
      
      if (batchEditData.transaction_date) {
        updateData.transaction_date = batchEditData.transaction_date;
      }
      
      if (batchEditData.category_id) {
        updateData.category_id = parseInt(batchEditData.category_id);
      }
      
      if (batchEditData.subcategory_id) {
        updateData.subcategory_id = parseInt(batchEditData.subcategory_id);
      }
      
      if (batchEditData.card_id) {
        updateData.card_id = parseInt(batchEditData.card_id);
      }
      
      // Atualizar todas as transações selecionadas
      await Promise.all(
        selectedTransactions.map(id => cardTransactionService.update(id, updateData))
      );
      
      // Fechar diálogo e recarregar transações
      setBatchEditDialogOpen(false);
      setSelectedTransactions([]);
      loadTransactions();
      
      // Mostrar mensagem de sucesso
      alert('Transações atualizadas com sucesso!');
    } catch (error) {
      console.error('Error updating transactions:', error);
      alert('Erro ao atualizar transações');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar subcategorias pela categoria selecionada
  const filteredSubcategories = subcategories.filter(
    sub => filters.categoryId.length === 0 || 
           filters.categoryId.includes(sub.category_id?.toString() || '')
  );

  // Calcular valor total do mês por cartão
  const calculateCardTotals = () => {
    const totals: { [key: number]: number } = {};
    
    transactions.forEach(transaction => {
      if (transaction.card_id) {
        if (!totals[transaction.card_id]) {
          totals[transaction.card_id] = 0;
        }
        totals[transaction.card_id] += transaction.amount;
      }
    });
    
    return totals;
  };

  const cardTotals = calculateCardTotals();

  // Funções de paginação
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Dados paginados
  const paginatedTransactions = transactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  console.log('Estado atual - transações:', transactions);
  console.log('Estado atual - cartões:', cards);
  console.log('Estado atual - loading:', loading);
  console.log('Número de transações:', transactions.length);
  console.log('Número de cartões:', cards.length);

  // Verificar se há transações e cartões
  console.log('Transações e cartões carregados:', transactions.length > 0 && cards.length > 0);

  // Função para lidar com ordenação
  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Aplicar ordenação às transações
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (orderBy) {
        case 'transaction_date':
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'category_name':
          aValue = (a.category_name || '').toLowerCase();
          bValue = (b.category_name || '').toLowerCase();
          break;
        case 'card_name':
          const cardA = cards.find(card => card.id === a.card_id)?.name || '';
          const cardB = cards.find(card => card.id === b.card_id)?.name || '';
          aValue = cardA.toLowerCase();
          bValue = cardB.toLowerCase();
          break;
        default:
          aValue = a[orderBy as keyof CardTransaction];
          bValue = b[orderBy as keyof CardTransaction];
      }

      if (bValue < aValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (bValue > aValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [transactions, order, orderBy, cards]);

  // Componente para cabeçalho ordenável
  const SortableTableCell = ({ children, sortKey, align = 'left', ...props }: {
    children: React.ReactNode;
    sortKey: string;
    align?: 'left' | 'right' | 'center';
    [key: string]: any;
  }) => {
    const isActive = orderBy === sortKey;
    const isAsc = order === 'asc';

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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
          {/* Modern Header */}
          <ModernHeader
            title="Cartões de Crédito"
            subtitle="Gerencie seus cartões e transações de crédito"
            breadcrumbs={[
              { label: 'TrackeOne Finance' },
              { label: 'Cartões de Crédito' }
            ]}
            actions={(
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingTransaction(null);
                  setShowTransactionForm(true);
                }}
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
              alignItems: 'center'
            }}>
              {/* Period Type Selector */}
              <FormControl size="small" sx={{ minWidth: 120, flex: '0 0 auto' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Período</InputLabel>
                <Select
                  value={advancedFilters.dateFilterType}
                  label="Período"
                  onChange={(e) => handleAdvancedFilterChange('dateFilterType', e.target.value as 'month' | 'year' | 'custom' | 'all')}
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
              {advancedFilters.dateFilterType === 'month' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    onClick={() => handleFilterChange('month', subMonths(filters.month, 1))}
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
                      value={filters.month}
                      onChange={(newValue) => newValue && handleFilterChange('month', newValue)}
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
                    onClick={() => handleFilterChange('month', addMonths(filters.month, 1))}
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

              {advancedFilters.dateFilterType === 'year' && (
                <Box sx={{ minWidth: 120, flex: '0 0 auto' }}>
                  <DatePicker
                    views={['year']}
                    label="Ano"
                    value={new Date(advancedFilters.selectedYear, 0, 1)}
                    onChange={(newValue) => newValue && handleAdvancedFilterChange('selectedYear', newValue.getFullYear())}
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

              {advancedFilters.dateFilterType === 'custom' && (
                <>
                  <Box sx={{ minWidth: 140, flex: '0 0 auto' }}>
                    <DatePicker
                      label="Data inicial"
                      value={advancedFilters.customStartDate}
                      onChange={(newValue) => handleAdvancedFilterChange('customStartDate', newValue)}
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
                      value={advancedFilters.customEndDate}
                      onChange={(newValue) => handleAdvancedFilterChange('customEndDate', newValue)}
                      slotProps={{ 
                        textField: { 
                          size: "small",
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

              {/* Filtro de cartão */}
              <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Cartão</InputLabel>
                <Select
                  value={filters.cardId}
                  label="Cartão"
                  onChange={(e) => handleFilterChange('cardId', e.target.value)}
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
                  <MenuItem value="">Todos os cartões</MenuItem>
                  {cards.map((card) => (
                    <MenuItem key={card.id} value={card.id?.toString()}>
                      {card.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Categoria */}
              <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Categoria</InputLabel>
                <Select
                  multiple
                  value={filters.categoryId}
                  label="Categoria"
                  onChange={(e) => {
                    const selected = e.target.value as string[];
                    handleFilterChange('categoryId', selected);
                    // Limpar subcategoria quando a categoria mudar
                    handleFilterChange('subcategoryId', '');
                  }}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Todas';
                    if (selected.length === 1) {
                      const category = categories.find(cat => cat.id?.toString() === selected[0]);
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
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id?.toString()}>
                      <Checkbox 
                        checked={filters.categoryId.includes(category.id?.toString() || '')} 
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                      />
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {filters.categoryId.length > 0 && (
                  <Chip 
                    label={filters.categoryId.length}
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

              {/* Subcategoria */}
              <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Subcategoria</InputLabel>
                <Select
                  multiple
                  value={filters.subcategoryId ? [filters.subcategoryId] : []}
                  label="Subcategoria"
                  onChange={(e) => {
                    const selected = e.target.value as string[];
                    handleFilterChange('subcategoryId', selected.length > 0 ? selected[0] : '');
                  }}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Todas';
                    const subcategory = subcategories.find(sub => sub.id?.toString() === selected[0]);
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
                  {filteredSubcategories.map((subcategory) => (
                    <MenuItem key={subcategory.id} value={subcategory.id?.toString()}>
                      <Checkbox 
                        checked={filters.subcategoryId === subcategory.id?.toString()} 
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                      />
                      {subcategory.name}
                    </MenuItem>
                  ))}
                </Select>
                {filters.subcategoryId && (
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

              {/* Botão para limpar filtros - usando o mesmo ícone do controle mensal */}
              <Button
                variant="text"
                size="small"
                onClick={handleClearFilters}
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
                <AutoFixHighIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          </Box>

          {/* Credit Cards Summary - Totalizadores */}
          {cards.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.gray[900] }}>
                Total de Cartões: {cards.length}
              </Typography>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2
              }}>
                {cards.map((card) => (
                  <ModernCard key={card.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.gray[900], fontSize: '0.9rem' }}>
                          {card.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.gray[600], fontSize: '0.8rem' }}>
                          Fecha: {card.closing_day} Vence: {card.due_day}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: colors.gray[900], fontWeight: 600, fontSize: '0.9rem' }}>
                          R$ {cardTotals[card.id!] ? cardTotals[card.id!].toFixed(2).replace('.', ',') : '0,00'}
                        </Typography>
                      </Box>
                    </Box>
                  </ModernCard>
                ))}
              </Box>
            </Box>
          )}

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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ color: colors.gray[600], fontWeight: 500 }}>
                  {selectedTransactions.length} de {transactions.length} registro(s) selecionado(s)
                </Typography>
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
              </Box>
            </Box>
          )}

          {/* Transactions */}
          <Paper sx={{ 
            borderRadius: 2,
            border: `1px solid ${colors.gray[200]}`,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 3, borderBottom: `1px solid ${colors.gray[200]}` }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[900] }}>
                Transações ({transactions.length})
              </Typography>
            </Box>
            <TableContainer>
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
                    <SortableTableCell sortKey="transaction_date">Data</SortableTableCell>
                    <SortableTableCell sortKey="description">Descrição</SortableTableCell>
                    <SortableTableCell sortKey="amount" align="right">Valor</SortableTableCell>
                    <SortableTableCell sortKey="category_name">Categoria</SortableTableCell>
                    <SortableTableCell sortKey="card_name">Cartão</SortableTableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      color: colors.gray[700],
                      bgcolor: colors.gray[50],
                      borderBottom: `2px solid ${colors.gray[200]}`
                    }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : sortedTransactions && sortedTransactions.length > 0 ? (
                    sortedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction) => {
                      console.log('Renderizando transação:', transaction);
                      const cardName = cards.find((card) => card.id === transaction.card_id)?.name || 'Cartão não encontrado';
                      console.log('Nome do cartão encontrado:', cardName);
                      
                      // Calcular valor total da transação (para transações parceladas)
                      let totalAmount = transaction.amount;
                      if (transaction.is_installment && transaction.total_installments) {
                        totalAmount = transaction.amount * transaction.total_installments;
                      }
                      
                      const isItemSelected = selectedTransactions.includes(transaction.id!);
                      
                      return (
                      <TableRow 
                        key={transaction.id} 
                        sx={{ 
                          '&:hover': { bgcolor: colors.gray[50] },
                          bgcolor: isItemSelected ? colors.primary[50] : 'white'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onChange={() => handleSelectTransaction(transaction.id!)}
                            sx={{ color: colors.primary[600] }}
                          />
                        </TableCell>
                        <TableCell>{
  // Criar data de forma segura para evitar problemas de timezone
  (() => {
    const [year, month, day] = transaction.transaction_date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
  })()
}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell align="right">
                          R$ {Number(transaction.amount)?.toFixed(2).replace('.', ',')}
                          {/* Valor total da transação de forma discreta */}
                          {transaction.is_installment && transaction.total_installments && transaction.total_installments > 1 && (
                            <Typography variant="body2" sx={{ color: colors.gray[500], fontSize: '0.75rem', mt: 0.5 }}>
                              R$ {totalAmount.toFixed(2).replace('.', ',')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.category_name || (transaction.category_id ? `Categoria ${transaction.category_id}` : '-')}
                        </TableCell>
                        <TableCell>
                          {cardName}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small"
                            onClick={(e) => handleActionMenuOpen(e, transaction.id!)}
                            sx={{ 
                              color: colors.gray[600],
                              '&:hover': { bgcolor: colors.gray[100] }
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )})
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          Nenhuma transação encontrada
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={transactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                borderTop: `1px solid ${colors.gray[200]}`,
                '& .MuiTablePagination-select': {
                  bgcolor: 'white',
                  borderRadius: 1,
                  border: `1px solid ${colors.gray[200]}`
                },
                '& .MuiTablePagination-actions': {
                  '& button': {
                    bgcolor: 'white',
                    borderRadius: 1,
                    border: `1px solid ${colors.gray[200]}`,
                    '&:hover': {
                      bgcolor: colors.gray[50]
                    }
                  }
                }
              }}
            />
          </Paper>
        </Box>
        
        {/* Menu de ações em lote */}
        <Menu
          anchorEl={batchActionsAnchor}
          open={Boolean(batchActionsAnchor)}
          onClose={() => setBatchActionsAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItemComponent onClick={handleBatchEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={handleBatchDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItemComponent>
        </Menu>
        
        {/* Menu de ações individuais */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItemComponent onClick={() => {
            const transaction = transactions.find(t => t.id === selectedTransactionId);
            if (transaction) {
              handleEditTransaction(transaction);
            }
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={() => {
            if (selectedTransactionId) {
              handleDeleteTransaction(selectedTransactionId);
            }
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItemComponent>
        </Menu>
        
        {/* Diálogo de edição em lote */}
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
                    <MenuItem key={category.id} value={category.id?.toString()}>
                      {category.name}
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
                      return sub.category_id?.toString() === batchEditData.category_id;
                    })
                    .map((subcategory) => (
                      <MenuItem key={subcategory.id} value={subcategory.id?.toString()}>
                        {subcategory.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              {/* Cartão */}
              <FormControl fullWidth size="small">
                <InputLabel>Cartão</InputLabel>
                <Select
                  value={batchEditData.card_id}
                  onChange={(e) => setBatchEditData(prev => ({ ...prev, card_id: e.target.value }))}
                  label="Cartão"
                >
                  <MenuItem value="">
                    <em>Não alterar</em>
                  </MenuItem>
                  {cards.map((card) => (
                    <MenuItem key={card.id} value={card.id?.toString()}>
                      {card.name}
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
        
        {/* Formulário de Transação */}
        <CreditCardTransactionForm
          open={showTransactionForm}
          onClose={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleTransactionSubmit}
          transaction={editingTransaction}
        />
      </Box>
    </LocalizationProvider>
  );
}
