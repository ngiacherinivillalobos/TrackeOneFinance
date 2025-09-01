import React, { useState, useEffect } from 'react';
// Updated with all filters in same line
import {
  Box,
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
  Snackbar,
  Alert,
  Paper,
  Autocomplete,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Download as DownloadIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  DeleteSweep,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  ShowChart as InvestmentIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, addMonths } from 'date-fns';
import { ModernHeader, ModernStatsCard } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';
import cashFlowService, { CashFlow } from '../services/cashFlowService';
import { categoryService } from '../services/categoryService';
import { subcategoryService } from '../services/subcategoryService';
import { costCenterService } from '../services/costCenterService';
import { useAuth } from '../contexts/AuthContext'; // Adicionado o import do useAuth

interface CashFlowRecord {
  id: number;
  description: string;
  amount: number;
  date: string;
  record_type: 'Despesa' | 'Receita';
  category?: { id: number; name: string; };
  subcategory?: { id: number; name: string; };
  cost_center?: { id: number; name: string; number?: string; };
}

interface CategoryData {
  id: number;
  name: string;
  source_type: string;
}

interface SubcategoryData {
  id: number;
  name: string;
  category_id: number;
}

interface CostCenterData {
  id: number;
  name: string;
  number?: string;
}

export default function CashFlowPage() {
  const { user } = useAuth(); // Adicionado o uso do hook useAuth
  const [cashFlowRecords, setCashFlowRecords] = useState<CashFlowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryData[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterData[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [batchActionsAnchor, setBatchActionsAnchor] = useState<HTMLElement | null>(null);
  const [newRecordMenuAnchor, setNewRecordMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CashFlowRecord | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    subcategory_id: '',
    cost_center_id: '',
    record_type: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Filtros e ordenação
  const [dateFilterType, setDateFilterType] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [filters, setFilters] = useState(() => {
    // Inicializa os filtros com valores padrão
    const defaultFilters = {
      record_type: [] as string[],
      category_id: [] as string[],
      subcategory_id: [] as string[],
      cost_center_id: [] as string[]
    };
    
    console.log('CashFlow - Usuário:', user);
    
    // Se o usuário tem um centro de custo associado, adiciona-o ao filtro por padrão
    if (user?.cost_center_id) {
      defaultFilters.cost_center_id = [user.cost_center_id.toString()];
      console.log('CashFlow - Centro de custo do usuário adicionado ao filtro:', user.cost_center_id);
    }
    
    console.log('CashFlow - Filtros iniciais:', defaultFilters);
    
    return defaultFilters;
  });

  // O filtro já é inicializado com o centro de custo do usuário, se existir
  // Não estamos mais utilizando useEffect para atualizar o filtro depois

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Função para filtrar registros por data
  const getFilteredRecordsByDate = () => {
    let startDate: Date;
    let endDate: Date;

    switch (dateFilterType) {
      case 'month':
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      case 'year':
        startDate = startOfYear(new Date(selectedYear, 0, 1));
        endDate = endOfYear(new Date(selectedYear, 0, 1));
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return cashFlowRecords;
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      case 'all':
      default:
        return cashFlowRecords;
    }

    return cashFlowRecords.filter(record => {
      const recordDate = new Date(record.date + 'T00:00:00');
      return recordDate >= startDate && recordDate <= endDate;
    });
  };

  // Função para aplicar todos os filtros
  const getFilteredRecords = () => {
    let filtered = getFilteredRecordsByDate();

    if (filters.record_type.length > 0) {
      filtered = filtered.filter(record => filters.record_type.includes(record.record_type));
    }

    if (filters.category_id.length > 0) {
      filtered = filtered.filter(record => 
        record.category && filters.category_id.includes(record.category.id.toString())
      );
    }

    if (filters.subcategory_id.length > 0) {
      filtered = filtered.filter(record => 
        record.subcategory && filters.subcategory_id.includes(record.subcategory.id.toString())
      );
    }

    if (filters.cost_center_id.length > 0) {
      filtered = filtered.filter(record => 
        record.cost_center && filters.cost_center_id.includes(record.cost_center.id.toString())
      );
    }

    return filtered;
  };

  const filteredRecords = getFilteredRecords();
  const totalReceitas = filteredRecords.filter(r => r.record_type === 'Receita').reduce((sum, r) => sum + r.amount, 0);
  const totalDespesas = filteredRecords.filter(r => r.record_type === 'Despesa').reduce((sum, r) => sum + r.amount, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;
  const totalRegistros = filteredRecords.length;

  useEffect(() => {
    loadData();
  }, [currentDate, filters, dateFilterType, customStartDate, customEndDate, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Preparar parâmetros para busca de cash flow
      const params: any = {};
      
      // Filtrar por mês/ano se aplicado
      if (dateFilterType === 'month') {
        params.month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        params.year = currentDate.getFullYear().toString();
      }
      
      // Aplicar filtro de centro de custo
      if (filters.cost_center_id.length > 0) {
        // Converter para string separada por vírgula para o backend
        params.cost_center_id = filters.cost_center_id.join(',');
        console.log('Centro de custo selecionados (CashFlow) - array:', JSON.stringify(filters.cost_center_id));
        console.log('Centro de custo selecionados (CashFlow) - string:', filters.cost_center_id.join(','));
      } else {
        // Se nenhum filtro estiver selecionado, mostrar todos os registros
        params.cost_center_id = 'all';
        console.log('Mostrando todos os centros de custo (sem filtro)');
      }
      
      const [recordsData, categoriesData, subcategoriesData, costCentersData] = await Promise.all([
        cashFlowService.getAll(params),
        categoryService.list(),
        subcategoryService.list(),
        costCenterService.list()
      ]);
      
      console.log('Parâmetros enviados para cashFlowService:', params);
      console.log('Filtro de centro de custo atual (CashFlow):', filters.cost_center_id);
      console.log('Registros retornados:', recordsData.length);
      
      
      setCashFlowRecords(recordsData.map(record => ({
        id: record.id!,
        description: record.description,
        amount: record.amount,
        date: record.date,
        record_type: record.record_type,
        category: record.category_id ? {
          id: record.category_id,
          name: categoriesData.find(cat => cat.id === record.category_id)?.name || 'N/A'
        } : undefined,
        subcategory: record.subcategory_id ? {
          id: record.subcategory_id,
          name: subcategoriesData.find(sub => sub.id === record.subcategory_id)?.name || 'N/A'
        } : undefined,
        cost_center: record.cost_center_id ? {
          id: record.cost_center_id,
          name: record.cost_center_name || costCentersData.find(cc => cc.id === record.cost_center_id)?.name || 'N/A',
          number: record.cost_center_number || costCentersData.find(cc => cc.id === record.cost_center_id)?.number
        } : undefined
      })));
      
      setCategories(categoriesData.map(cat => ({ id: cat.id!, name: cat.name, source_type: cat.source_type })));
      setSubcategories(subcategoriesData.map(sub => ({ id: sub.id!, name: sub.name, category_id: sub.category_id })));
      setCostCenters(costCentersData.map(cc => ({ id: cc.id!, name: cc.name, number: cc.number })));
      
      // Não precisamos mais definir o filtro aqui pois já está sendo feito no useEffect separado

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]
    );
  };

  const handleSelectAllRecords = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRecords(event.target.checked ? filteredRecords.map(r => r.id) : []);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, recordId: number) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedRecordId(recordId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedRecordId(null);
  };

  const handleNewRecord = (type: 'Despesa' | 'Receita') => {
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category_id: '',
      subcategory_id: '',
      cost_center_id: '',
      record_type: type
    });
    setEditingRecord(null);
    setRecordDialogOpen(true);
    setNewRecordMenuAnchor(null);
  };

  const handleEditRecord = (record: CashFlowRecord) => {
    setEditingRecord(record);
    const formatValueForEdit = (value: number): string => {
      return value.toFixed(2).replace('.', ',');
    };
    
    setFormData({
      date: record.date,
      description: record.description,
      amount: formatValueForEdit(record.amount),
      record_type: record.record_type,
      category_id: record.category?.id?.toString() || '',
      subcategory_id: record.subcategory?.id?.toString() || '',
      cost_center_id: record.cost_center?.id?.toString() || ''
    });
    setRecordDialogOpen(true);
    handleActionMenuClose();
  };

  const handleCloseDialog = () => {
    setRecordDialogOpen(false);
    setEditingRecord(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRecord = async () => {
    try {
      // Validações básicas
      if (!formData.description.trim()) {
        showSnackbar('Descrição é obrigatória', 'error');
        return;
      }
      
      if (!formData.amount.trim()) {
        showSnackbar('Valor é obrigatório', 'error');
        return;
      }
      
      if (!formData.record_type) {
        showSnackbar('Tipo de registro é obrigatório', 'error');
        return;
      }
      
      if (!formData.date) {
        showSnackbar('Data é obrigatória', 'error');
        return;
      }
      
      // Validar se o centro de custo foi informado
      if (!formData.cost_center_id || formData.cost_center_id.trim() === '') {
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
      
      const amount = parseBrazilianNumber(formData.amount);
      if (amount <= 0) {
        showSnackbar('Valor deve ser maior que zero', 'error');
        return;
      }
      
      const recordData = {
        description: formData.description.trim(),
        amount: amount,
        date: formData.date,
        record_type: formData.record_type as 'Despesa' | 'Receita',
        category_id: formData.category_id && formData.category_id.trim() !== '' ? parseInt(formData.category_id) : undefined,
        subcategory_id: formData.subcategory_id && formData.subcategory_id.trim() !== '' ? parseInt(formData.subcategory_id) : undefined,
        cost_center_id: formData.cost_center_id && formData.cost_center_id.trim() !== '' ? parseInt(formData.cost_center_id) : undefined
      };

      // Validar se os IDs são números válidos quando fornecidos
      if (recordData.category_id && isNaN(recordData.category_id)) {
        showSnackbar('ID da categoria inválido', 'error');
        return;
      }
      
      if (recordData.subcategory_id && isNaN(recordData.subcategory_id)) {
        showSnackbar('ID da subcategoria inválido', 'error');
        return;
      }
      
      if (recordData.cost_center_id && isNaN(recordData.cost_center_id)) {
        showSnackbar('ID do centro de custo inválido', 'error');
        return;
      }

      if (editingRecord) {
        await cashFlowService.update(editingRecord.id, recordData);
        showSnackbar('Registro atualizado com sucesso', 'success');
      } else {
        await cashFlowService.create(recordData);
        showSnackbar('Registro criado com sucesso', 'success');
      }
      
      loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      showSnackbar('Erro ao salvar registro', 'error');
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    try {
      await cashFlowService.delete(recordId);
      loadData();
      showSnackbar('Registro excluído com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      showSnackbar('Erro ao excluir registro', 'error');
    }
    handleActionMenuClose();
  };

  const handleDuplicateRecord = async (recordId: number) => {
    try {
      const record = cashFlowRecords.find(r => r.id === recordId);
      if (record) {
        const newRecord = {
          description: `Cópia de ${record.description}`,
          amount: record.amount,
          date: format(new Date(), 'yyyy-MM-dd'),
          record_type: record.record_type,
          category_id: record.category?.id,
          subcategory_id: record.subcategory?.id,
          cost_center_id: record.cost_center?.id
        };
        await cashFlowService.create(newRecord);
        loadData();
        showSnackbar('Registro duplicado com sucesso', 'success');
      }
    } catch (error) {
      console.error('Erro ao duplicar registro:', error);
      showSnackbar('Erro ao duplicar registro', 'error');
    }
    handleActionMenuClose();
  };

  const handleBatchDelete = async () => {
    try {
      await Promise.all(selectedRecords.map(id => cashFlowService.delete(id)));
      loadData();
      setSelectedRecords([]);
      showSnackbar('Registros excluídos com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao excluir registros:', error);
      showSnackbar('Erro ao excluir registros', 'error');
    }
    setBatchActionsAnchor(null);
  };

  // Carregar dados para os filtros
  const loadFilterData = async () => {
    try {
      console.log('CashFlow - Carregando dados para filtros...');
      
      // Carregar categorias
      const categoryData = await categoryService.getAll();
      console.log('CashFlow - Categorias carregadas:', categoryData);
      setCategories(categoryData);
      
      // Carregar subcategorias
      const subcategoryData = await subcategoryService.getAll();
      console.log('CashFlow - Subcategorias carregadas:', subcategoryData);
      setSubcategories(subcategoryData);
      
      // Carregar centros de custo
      const costCenterData = await costCenterService.getAll();
      console.log('CashFlow - Centros de custo carregados:', costCenterData);
      setCostCenters(costCenterData);
      
    } catch (error) {
      console.error('Erro ao carregar dados para filtros:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao carregar dados para filtros', 
        severity: 'error' 
      });
    }
  };

  // Carregar dados iniciais
  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      
      // Adicionar filtros de data com base no tipo selecionado
      switch (dateFilterType) {
        case 'month':
          params.append('month', (currentDate.getMonth() + 1).toString().padStart(2, '0'));
          params.append('year', currentDate.getFullYear().toString());
          break;
        case 'year':
          params.append('year', selectedYear.toString());
          break;
        case 'custom':
          if (customStartDate) {
            params.append('start_date', customStartDate.toISOString().split('T')[0]);
          }
          if (customEndDate) {
            params.append('end_date', customEndDate.toISOString().split('T')[0]);
          }
          break;
      }
      
      // Adicionar filtro de centro de custo se especificado
      if (filters.cost_center_id.length > 0) {
        params.append('cost_center_id', filters.cost_center_id.join(','));
      } else if (user?.cost_center_id) {
        // Se o usuário tem um centro de custo associado, usar por padrão
        params.append('cost_center_id', user.cost_center_id.toString());
      }

      console.log('CashFlow - Parâmetros da requisição:', Object.fromEntries(params));
      
      const data = await cashFlowService.getAll(Object.fromEntries(params));
      console.log('CashFlow - Dados recebidos:', data);
      setCashFlowRecords(data);
      setSelectedRecords([]);
    } catch (error) {
      console.error('Erro ao carregar dados do fluxo de caixa:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao carregar dados do fluxo de caixa', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
          <ModernHeader
            title="Fluxo de Caixa"
            subtitle="Gerencie seus registros financeiros diários"
            breadcrumbs={[
              { label: 'TrackeOne Finance' },
              { label: 'Fluxo de Caixa' }
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
                    '&:hover': { borderColor: colors.primary[400], bgcolor: colors.primary[50] }
                  }}
                >
                  Exportar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={(e) => setNewRecordMenuAnchor(e.currentTarget)}
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
                  Novo Registro
                </Button>
              </Box>
            )}
          />

          {/* Modern Filters Section - Above stats cards */}
          <Box sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            mb: 3,
            border: `1px solid ${colors.gray[200]}`,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            transition: 'all 0.3s ease'
          }}>

            {/* Main filters row */}
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 1, sm: 1.5, md: 2 },
              alignItems: 'center'
            }}>
              {/* Date Filter */}
              <FormControl size="small" sx={{ minWidth: 120, flex: '0 0 auto' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Período</InputLabel>
                <Select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value as any)}
                  label="Período"
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

              {/* Month navigation for month filter */}
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

              {/* Year selector for year filter */}
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

              {/* Custom date range */}
              {dateFilterType === 'custom' && (
                <>
                  <Box sx={{ minWidth: 140, flex: '0 0 auto' }}>
                    <DatePicker
                      label="Data inicial"
                      value={customStartDate}
                      onChange={setCustomStartDate}
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
                      onChange={setCustomEndDate}
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
                  value={filters.record_type}
                  label="Tipo"
                  onChange={(e) => setFilters(prev => ({ ...prev, record_type: e.target.value as string[] }))}
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
                      checked={filters.record_type.includes('Despesa')} 
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
                      checked={filters.record_type.includes('Receita')} 
                      size="small"
                      sx={{ mr: 1, p: 0 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IncomeIcon sx={{ fontSize: 16, color: colors.success[600] }} />
                      Receita
                    </Box>
                  </MenuItem>
                </Select>
                {filters.record_type.length > 0 && (
                  <Chip 
                    label={filters.record_type.length}
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

              {/* Category Filter */}
              <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Categoria</InputLabel>
                <Select
                  multiple
                  value={filters.category_id}
                  label="Categoria"
                  onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value as string[] }))}
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
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      <Checkbox 
                        checked={filters.category_id.includes(category.id.toString())} 
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                      />
                      {category.name}
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

              {/* Subcategory Filter */}
              <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto', position: 'relative' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Subcategoria</InputLabel>
                <Select
                  multiple
                  value={filters.subcategory_id}
                  label="Subcategoria"
                  onChange={(e) => setFilters(prev => ({ ...prev, subcategory_id: e.target.value as string[] }))}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Todas';
                    if (selected.length === 1) {
                      const subcategory = subcategories.find(sub => sub.id.toString() === selected[0]);
                      return subcategory ? subcategory.name : selected[0];
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
                  {subcategories.map((subcategory) => (
                    <MenuItem key={subcategory.id} value={subcategory.id.toString()}>
                      <Checkbox 
                        checked={filters.subcategory_id.includes(subcategory.id.toString())} 
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                      />
                      {subcategory.name}
                    </MenuItem>
                  ))}
                </Select>
                {filters.subcategory_id.length > 0 && (
                  <Chip 
                    label={filters.subcategory_id.length}
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

              {/* Cost Center Filter */}
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
                      borderColor: colors.primary[300]
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

              {/* Action Buttons Inline */}
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setFilters({ record_type: [], category_id: [], subcategory_id: [], cost_center_id: [] });
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
                <DeleteSweep sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ 
            display: 'flex',
            gap: { xs: 1, sm: 1.5, md: 2 },
            mb: 3,
            overflow: 'hidden',
            '& > *': { flex: '1 1 0', minWidth: 0 }
          }}>
            <ModernStatsCard
              title="Receitas"
              value={formatCurrency(totalReceitas)}
              subtitle="Total de entradas"
              icon={<IncomeIcon sx={{ fontSize: 16 }} />}
              color="success"
              trend={{ value: 8.5, isPositive: true }}
            />
            <ModernStatsCard
              title="Despesas"
              value={formatCurrency(totalDespesas)}
              subtitle="Total de saídas"
              icon={<ExpenseIcon sx={{ fontSize: 16 }} />}
              color="error"
              trend={{ value: 12.3, isPositive: false }}
            />
            <ModernStatsCard
              title="Saldo"
              value={formatCurrency(saldoPeriodo)}
              subtitle="Receitas - Despesas"
              icon={<AccountBalanceIcon sx={{ fontSize: 16 }} />}
              color={saldoPeriodo >= 0 ? 'success' : 'error'}
              trend={{ value: Math.abs((saldoPeriodo / 10000) * 100), isPositive: saldoPeriodo >= 0 }}
            />
            <ModernStatsCard
              title="Total de Registros"
              value={totalRegistros.toString()}
              subtitle="Registros cadastrados"
              icon={<ReceiptIcon sx={{ fontSize: 16 }} />}
              color="primary"
            />
          </Box>

          {/* Counter and Batch Actions - Following MonthlyControl pattern */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ color: colors.gray[600], fontWeight: 500 }}>
              {selectedRecords.length} de {filteredRecords.length} registro(s) selecionado(s)
            </Typography>
            {selectedRecords.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => setBatchActionsAnchor(e.currentTarget)}
                startIcon={<MoreVertIcon />}
                sx={{
                  borderColor: colors.primary[300],
                  color: colors.primary[600],
                  '&:hover': {
                    borderColor: colors.primary[400],
                    bgcolor: colors.primary[50]
                  }
                }}
              >
                Ações em lote
              </Button>
            )}
          </Box>

          {/* Table will be completed in next part */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: shadows.sm }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.gray[50] }}>
                  <TableCell padding="checkbox" sx={{ width: '4%', bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}` }}>
                    <Checkbox
                      checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                      indeterminate={selectedRecords.length > 0 && selectedRecords.length < filteredRecords.length}
                      onChange={handleSelectAllRecords}
                      sx={{ color: colors.primary[600] }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '12%' }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '40%' }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '15%' }} align="right">Valor (R$)</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '15%' }}>Centro de Custo</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '10%' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Carregando...</TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 4 }}>
                        <ReceiptIcon sx={{ fontSize: 48, color: colors.gray[400], mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">Nenhum registro encontrado</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox 
                          checked={selectedRecords.includes(record.id)}
                          onChange={() => handleSelectRecord(record.id)}
                          sx={{ color: colors.primary[600] }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {format(new Date(record.date + 'T00:00:00'), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ 
                            mt: 0.25,
                            color: record.record_type === 'Receita' ? colors.success[600] : colors.error[600]
                          }}>
                            {record.record_type === 'Receita' ? 
                              <IncomeIcon sx={{ fontSize: 18 }} /> : 
                              <ExpenseIcon sx={{ fontSize: 18 }} />
                            }
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              {record.description}
                            </Typography>
                            {(record.category || record.cost_center) && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                {record.category && (
                                  <Typography variant="caption" sx={{ color: colors.gray[600], fontSize: '0.75rem' }}>
                                    {record.category.name}
                                    {record.subcategory && ` > ${record.subcategory.name}`}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: record.record_type === 'Receita' ? colors.success[600] : colors.error[600]
                          }}
                        >
                          {record.record_type === 'Receita' ? '+' : '-'} {formatCurrency(Math.abs(record.amount))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                          {record.cost_center ? 
                            (record.cost_center.number ? `${record.cost_center.number} - ${record.cost_center.name}` : record.cost_center.name) :
                            '-'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, record.id)}
                          sx={{
                            color: colors.gray[500],
                            '&:hover': {
                              bgcolor: colors.gray[100],
                              color: colors.gray[700]
                            }
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Menus and Dialogs */}
          
          {/* Menu para novo registro */}
          <Menu
            anchorEl={newRecordMenuAnchor}
            open={Boolean(newRecordMenuAnchor)}
            onClose={() => setNewRecordMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleNewRecord('Receita')}>
              <ListItemIcon>
                <IncomeIcon sx={{ color: colors.success[600] }} />
              </ListItemIcon>
              <ListItemText>Nova Receita</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNewRecord('Despesa')}>
              <ListItemIcon>
                <ExpenseIcon sx={{ color: colors.error[600] }} />
              </ListItemIcon>
              <ListItemText>Nova Despesa</ListItemText>
            </MenuItem>
          </Menu>

          {/* Menu de ações individuais */}
          <Menu
            anchorEl={actionMenuAnchorEl}
            open={Boolean(actionMenuAnchorEl)}
            onClose={handleActionMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => {
              const record = cashFlowRecords.find(r => r.id === selectedRecordId);
              if (record) handleEditRecord(record);
            }}>
              <ListItemIcon>
                <EditIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              if (selectedRecordId) handleDuplicateRecord(selectedRecordId);
            }}>
              <ListItemIcon>
                <DuplicateIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText>Duplicar</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => {
                if (selectedRecordId) handleDeleteRecord(selectedRecordId);
              }}
              sx={{ color: colors.error[600] }}
            >
              <ListItemIcon>
                <DeleteIcon sx={{ fontSize: 18, color: colors.error[600] }} />
              </ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          </Menu>

          {/* Menu de ações em lote */}
          <Menu
            anchorEl={batchActionsAnchor}
            open={Boolean(batchActionsAnchor)}
            onClose={() => setBatchActionsAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleBatchDelete} sx={{ color: colors.error[600] }}>
              <ListItemIcon>
                <DeleteIcon sx={{ fontSize: 18, color: colors.error[600] }} />
              </ListItemIcon>
              <ListItemText>Excluir selecionados</ListItemText>
            </MenuItem>
          </Menu>

          {/* Dialog para criar/editar registro */}
          <Dialog 
            open={recordDialogOpen} 
            onClose={handleCloseDialog} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
              sx: { borderRadius: 3 }
            }}
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveRecord();
            }}>
              <DialogTitle sx={{ bgcolor: '#f8fafc', fontWeight: 'bold', color: '#1a365d' }}>
                {editingRecord ? 'Editar Registro' : 'Novo Registro'}
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
                  {/* Primeira linha - Tipo, Data, Valor */}
                  <Box>
                    <FormControl fullWidth required size="small">
                      <InputLabel>Tipo de Registro</InputLabel>
                      <Select
                        value={formData.record_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, record_type: e.target.value }))}
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
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <TextField
                      label="Data do Registro"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                      label="Descrição do Registro"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      fullWidth
                      required
                      size="small"
                      multiline
                      rows={2}
                    />
                  </Box>

                  {/* Terceira linha - Categoria, Subcategoria e Centro de Custo na mesma linha */}
                  <Box>
                    <Autocomplete
                      options={categories.filter(cat => cat.source_type === formData.record_type)}
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

                  <Box>
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

                  <Box>
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
                        />
                      )}
                    />
                  </Box>
                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleCloseDialog} variant="outlined">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading}
                >
                  {editingRecord ? 'Atualizar' : 'Criar'} Registro
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Snackbar para notificações */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
      </Box>
    </LocalizationProvider>
  );
}