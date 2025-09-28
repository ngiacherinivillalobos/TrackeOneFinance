// Updated with all filters in same line
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
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
  KeyboardArrowLeft as ChevronLeftIcon,
  KeyboardArrowRight as ChevronRightIcon,
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

interface CashFlowRecord extends CashFlow {
  category?: { id: number; name: string; };
  subcategory?: { id: number; name: string; };
  cost_center?: { id: number; name: string; number?: string; };
}

interface CategoryData {
  id: number;
  name: string;
  source_type: string;
  created_at?: string;
}

interface SubcategoryData {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  created_at?: string;
}

interface CostCenterData {
  id: number;
  name: string;
  number?: string;
  created_at?: string;
}

interface Filters {
  record_type: string[];
  category_id: string[];
  subcategory_id: string[];
  cost_center_id: string[];
}

export default function CashFlowPage() {
  const { user } = useAuth(); // Adicionado o uso do hook useAuth
  console.log('Usuário logado:', user);
  
  const [cashFlowRecords, setCashFlowRecords] = useState<CashFlowRecord[]>([]);
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
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>('date');
  
  // Filtros e ordenação
  const [dateFilterType, setDateFilterType] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<Filters>({
    record_type: [],
    category_id: [],
    subcategory_id: [],
    cost_center_id: []
  });
  // Log para verificar os valores iniciais
  console.log('Estado inicial:', { 
    dateFilterType, 
    currentDate, 
    selectedYear, 
    userCostCenterId: user?.cost_center_id,
    filters 
  });
  
  // Log para verificar quando os filtros mudam
  useEffect(() => {
    console.log('Filtros atualizados:', filters);
  }, [filters]);
  
  // Log para verificar quando a data muda
  useEffect(() => {
    console.log('Data atualizada:', currentDate);
  }, [currentDate]);
  
  // Log para verificar quando o tipo de filtro muda
  useEffect(() => {
    console.log('Tipo de filtro atualizado:', dateFilterType);
  }, [dateFilterType]);
  
  // Log para verificar quando o ano selecionado muda
  useEffect(() => {
    console.log('Ano selecionado atualizado:', selectedYear);
  }, [selectedYear]);
  
  // Log para verificar quando o usuário muda
  useEffect(() => {
    console.log('Usuário atualizado:', user);
    // Atualizar os filtros quando o usuário muda
    if (user?.cost_center_id) {
      setFilters(prev => ({
        ...prev,
        cost_center_id: [user.cost_center_id?.toString() || '']
      }));
      console.log('Filtro de centro de custo atualizado para usuário:', user.cost_center_id);
    } else {
      console.log('Usuário sem centro de custo atribuído');
    }
  }, [user]);
  
  // Log para verificar quando os filtros de centro de custo mudam
  useEffect(() => {
    console.log('Filtros de centro de custo atualizados:', filters.cost_center_id);
  }, [filters.cost_center_id]);
  
  // Log para verificar quando qualquer filtro muda
  useEffect(() => {
    console.log('Qualquer filtro mudou:', { dateFilterType, currentDate, selectedYear, filters });
  }, [dateFilterType, currentDate, selectedYear, filters]);
  
  // Log para verificar quando os filtros de tipo de registro mudam
  useEffect(() => {
    console.log('Filtros de tipo de registro atualizados:', filters.record_type);
  }, [filters.record_type]);
  
  // Log para verificar quando os filtros de categoria mudam
  useEffect(() => {
    console.log('Filtros de categoria atualizados:', filters.category_id);
  }, [filters.category_id]);
  
  // Atualizar filtro de centro de custo quando o usuário mudar
  // Removido para evitar conflitos com a lógica de filtragem no backend
  /*useEffect(() => {
    if (user?.cost_center_id) {
      setFilters(prev => ({
        ...prev,
        cost_center_id: [user.cost_center_id?.toString() || '']
      }));
      console.log('Filtro de centro de custo atualizado para usuário:', user.cost_center_id);
    } else {
      // Se o usuário não tem centro de custo, limpar o filtro
      setFilters(prev => ({
        ...prev,
        cost_center_id: []
      }));
      console.log('Filtro de centro de custo limpo (usuário sem centro de custo)');
    }
  }, [user?.cost_center_id]);*/
  
  // Log para verificar quando os filtros de subcategoria mudam
  useEffect(() => {
    console.log('Filtros de subcategoria atualizados:', filters.subcategory_id);
  }, [filters.subcategory_id]);
  
  // Log para verificar quando os filtros de data mudam
  useEffect(() => {
    console.log('Filtros de data atualizados:', { dateFilterType, currentDate, selectedYear });
  }, [dateFilterType, currentDate, selectedYear]);
  
  // Log para verificar quando os filtros de loading mudam
  useEffect(() => {
    console.log('Filtros de loading atualizados:', loading);
  }, [loading]);
  
  // Log para verificar quando os filtros de user mudam
  useEffect(() => {
    console.log('Filtros de user atualizados:', user);
  }, [user]);
  
  // Log para verificar quando os filtros de costCenters mudam
  useEffect(() => {
    console.log('Filtros de costCenters atualizados:', costCenters);
  }, [costCenters]);
  
  // Log para verificar quando os filtros de categories mudam
  useEffect(() => {
    console.log('Filtros de categories atualizados:', categories);
  }, [categories]);
  
  // Log para verificar quando os filtros de subcategories mudam
  useEffect(() => {
    console.log('Filtros de subcategories atualizados:', subcategories);
  }, [subcategories]);
  
  // Log para verificar quando os filtros de cashFlowRecords mudam
  useEffect(() => {
    console.log('Filtros de cashFlowRecords atualizados:', cashFlowRecords);
  }, [cashFlowRecords]);
  
  // Log para verificar quando os filtros de selectedRecords mudam
  useEffect(() => {
    console.log('Filtros de selectedRecords atualizados:', selectedRecords);
  }, [selectedRecords]);
  
  // Log para verificar quando os filtros de actionMenuAnchorEl mudam
  useEffect(() => {
    console.log('Filtros de actionMenuAnchorEl atualizados:', actionMenuAnchorEl);
  }, [actionMenuAnchorEl]);
  
  // Log para verificar quando os filtros de batchActionsAnchor mudam
  useEffect(() => {
    console.log('Filtros de batchActionsAnchor atualizados:', batchActionsAnchor);
  }, [batchActionsAnchor]);
  
  // Log para verificar quando os filtros de newRecordMenuAnchor mudam
  useEffect(() => {
    console.log('Filtros de newRecordMenuAnchor atualizados:', newRecordMenuAnchor);
  }, [newRecordMenuAnchor]);
  
  // Log para verificar quando os filtros de selectedRecordId mudam
  useEffect(() => {
    console.log('Filtros de selectedRecordId atualizados:', selectedRecordId);
  }, [selectedRecordId]);
  
  // Log para verificar quando os filtros de recordDialogOpen mudam
  useEffect(() => {
    console.log('Filtros de recordDialogOpen atualizados:', recordDialogOpen);
  }, [recordDialogOpen]);
  
  // Log para verificar quando os filtros de editingRecord mudam
  useEffect(() => {
    console.log('Filtros de editingRecord atualizados:', editingRecord);
  }, [editingRecord]);
  
  // Log para verificar quando os filtros de formData mudam
  useEffect(() => {
    console.log('Filtros de formData atualizados:', formData);
  }, [formData]);
  
  // Log para verificar quando os filtros de snackbar mudam
  useEffect(() => {
    console.log('Filtros de snackbar atualizados:', snackbar);
  }, [snackbar]);
  
  // Log para verificar quando os filtros de loading mudam
  useEffect(() => {
    console.log('Filtros de loading atualizados:', loading);
  }, [loading]);
  
  // Log para verificar quando os filtros de order mudam
  useEffect(() => {
    console.log('Filtros de order atualizados:', order);
  }, [order]);
  
  // Log para verificar quando os filtros de orderBy mudam
  useEffect(() => {
    console.log('Filtros de orderBy atualizados:', orderBy);
  }, [orderBy]);
  
  // useEffect para carregar dados iniciais dos filtros
  useEffect(() => {
    console.log('Carregando dados dos filtros...');
    loadFilterData();
  }, []);
  
  // Log para verificar a data inicial
  useEffect(() => {
    console.log('Data inicial configurada:', {
      currentDate: currentDate.toISOString(),
      currentMonth: currentDate.getMonth() + 1,
      currentYear: currentDate.getFullYear(),
      selectedYear
    });
  }, []);
  
  // Log para verificar quando os filtros de usuário mudam
  useEffect(() => {
    console.log('Filtros de usuário atualizados:', user);
  }, [user]);

  // O filtro já é inicializado com o centro de custo do usuário, se existir
  // Não estamos mais utilizando useEffect para atualizar o filtro depois

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    console.log('Formatando moeda:', { value, formatted });
    return formatted;
  };

  // Helper function para converter datas de forma segura
  const formatSafeDate = (dateString: string): string => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.warn('Erro ao converter data:', dateString, error);
      return 'Data inválida';
    }
  };

  // Helper function para converter valores monetários de forma segura
  const getSafeAmount = (amount: any): number => {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Função para aplicar ordenação (semelhante ao MonthlyControl)
  const getComparator = (order: 'asc' | 'desc', orderBy: string) => {
    return order === 'desc'
      ? (a: any, b: any) => descendingComparator(a, b, orderBy)
      : (a: any, b: any) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a: any, b: any, orderBy: string) => {
    let aValue: any;
    let bValue: any;

    switch (orderBy) {
      case 'date':
        aValue = new Date(a.date + 'T00:00:00');
        bValue = new Date(b.date + 'T00:00:00');
        break;
      case 'description':
        aValue = a.description.toLowerCase();
        bValue = b.description.toLowerCase();
        break;
      case 'amount':
        aValue = getSafeAmount(a.amount);
        bValue = getSafeAmount(b.amount);
        break;
      default:
        aValue = a[orderBy];
        bValue = b[orderBy];
    }

    // Corrigido: Para ordem decrescente, b deve vir antes de a se b > a
    if (bValue < aValue) {
      return -1;
    }
    if (bValue > aValue) {
      return 1;
    }
    return 0;
  };

  // Função para exportar para Excel
  const handleExportToExcel = () => {
    try {
      // Aplicar a mesma ordenação que está sendo usada na tabela
      const orderedRecords = [...filteredRecords].sort(getComparator(order, orderBy));
      
      // Mapear os dados dos registros para o formato de exportação
      const exportData = orderedRecords.map(record => {
        return {
          'Data': formatSafeDate(record.date),
          'Descrição': record.description || '-',
          'Valor': `R$ ${getSafeAmount(record.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          'Tipo de Registro': record.record_type || '-',
          'Centro de Custo': record.cost_center ? 
            (record.cost_center.number ? `${record.cost_center.number} - ${record.cost_center.name}` : record.cost_center.name) : '-',
          'Categoria': record.category?.name || '-',
          'Subcategoria': record.subcategory?.name || '-'
        };
      });
      
      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Adicionar o worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa');
      
      // Gerar nome do arquivo com data e hora da exportação
      const getFileName = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        return `fluxo-caixa-${year}${month}${day}-${hour}${minute}.xlsx`;
      };
      
      // Criar blob e URL
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = getFileName();
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos e exibir notificação apenas após o clique no download
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Exibir mensagem de sucesso apenas após iniciar o download
      setSnackbar({
        open: true,
        message: `Arquivo exportado com sucesso! ${orderedRecords.length} registros exportados.`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao exportar arquivo. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Função para filtrar registros por data
  const getFilteredRecordsByDate = useCallback(() => {
    let startDate: Date;
    let endDate: Date;

    switch (dateFilterType) {
      case 'month':
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        console.log('Filtro por mês:', { startDate, endDate, currentDate });
        break;
      case 'year':
        startDate = startOfYear(new Date(selectedYear, 0, 1));
        endDate = endOfYear(new Date(selectedYear, 0, 1));
        console.log('Filtro por ano:', { startDate, endDate });
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return cashFlowRecords;
        startDate = customStartDate;
        endDate = customEndDate;
        console.log('Filtro personalizado:', { startDate, endDate });
        break;
      case 'all':
      default:
        console.log('Mostrando todos os registros');
        return cashFlowRecords;
    }

    const filtered = cashFlowRecords.filter(record => {
      const recordDate = new Date(record.date + 'T00:00:00');
      const result = recordDate >= startDate && recordDate <= endDate;
      console.log('Filtrando registro:', { recordDate, startDate, endDate, result, record });
      return result;
    });
    
    console.log('Registros filtrados por data:', filtered.length);
    return filtered;
  }, [dateFilterType, currentDate, selectedYear, customStartDate, customEndDate, cashFlowRecords]);

  // Função para aplicar todos os filtros
  const getFilteredRecords = useCallback(() => {
    let filtered = getFilteredRecordsByDate();
    console.log('Registros após filtro de data:', filtered.length, filtered);

    if (filters.record_type.length > 0) {
      filtered = filtered.filter(record => filters.record_type.includes(record.record_type));
      console.log('Registros após filtro de tipo:', filtered.length);
    }

    if (filters.category_id.length > 0) {
      filtered = filtered.filter(record => 
        record.category && filters.category_id.includes(record.category.id.toString())
      );
      console.log('Registros após filtro de categoria:', filtered.length);
    }

    if (filters.subcategory_id.length > 0) {
      filtered = filtered.filter(record => 
        record.subcategory && filters.subcategory_id.includes(record.subcategory.id.toString())
      );
      console.log('Registros após filtro de subcategoria:', filtered.length);
    }

    if (filters.cost_center_id.length > 0) {
      filtered = filtered.filter(record => 
        record.cost_center && filters.cost_center_id.includes(record.cost_center.id.toString())
      );
      console.log('Registros após filtro de centro de custo:', filtered.length, filters.cost_center_id);
    } else {
      console.log('Nenhum filtro de centro de custo aplicado - mostrando todos os registros');
    }

    console.log('Total de registros filtrados:', filtered.length);
    return filtered;
  }, [filters, getFilteredRecordsByDate]);

  const filteredRecords = useMemo(() => {
    const records = getFilteredRecords();
    console.log('Registros filtrados (memo):', records.length);
    return records;
  }, [getFilteredRecords]);
  
  const totalReceitas = useMemo(() => {
    const filteredReceitas = filteredRecords.filter(r => r.record_type === 'Receita');
    console.log('Registros de receita filtrados:', filteredReceitas);
    
    const total = filteredReceitas.reduce((sum, r) => {
      console.log('Processando receita:', { id: r.id, amount: r.amount, type: typeof r.amount });
      const amount = typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount;
      const validAmount = isNaN(amount) ? 0 : amount;
      console.log('Valor convertido:', { original: r.amount, converted: validAmount });
      return sum + validAmount;
    }, 0);
    
    console.log('Total de receitas calculado:', total);
    return total;
  }, [filteredRecords]);
  
  const totalDespesas = useMemo(() => {
    const filteredDespesas = filteredRecords.filter(r => r.record_type === 'Despesa');
    console.log('Registros de despesa filtrados:', filteredDespesas);
    
    const total = filteredDespesas.reduce((sum, r) => {
      console.log('Processando despesa:', { id: r.id, amount: r.amount, type: typeof r.amount });
      const amount = typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount;
      const validAmount = isNaN(amount) ? 0 : amount;
      console.log('Valor convertido:', { original: r.amount, converted: validAmount });
      return sum + validAmount;
    }, 0);
    
    console.log('Total de despesas calculado:', total);
    return total;
  }, [filteredRecords]);
  
  const saldoPeriodo = useMemo(() => {
    const saldo = totalReceitas - totalDespesas;
    console.log('Saldo do período:', saldo);
    return saldo;
  }, [totalReceitas, totalDespesas]);
  
  const totalRegistros = useMemo(() => {
    const count = filteredRecords.length;
    console.log('Total de registros:', count);
    return count;
  }, [filteredRecords]);

  useEffect(() => {
    let isMounted = true;
    
    const loadDataWrapper = async () => {
      if (isMounted) {
        console.log('UseEffect disparado - filtros:', { 
          dateFilterType, 
          currentDate: currentDate.toISOString(),
          selectedYear,
          filters,
          userCostCenterId: user?.cost_center_id
        });
        await loadData();
      }
    };
    
    loadDataWrapper();
    
    return () => {
      isMounted = false;
    };
  }, [dateFilterType, currentDate.toISOString(), selectedYear, JSON.stringify(filters), user?.cost_center_id, customStartDate, customEndDate]); // Mudando para currentDate.toISOString() para garantir que mude quando a data mudar

  const loadData = useCallback(async () => {
    if (loading) return; // Evitar chamadas redundantes
    
    try {
      setLoading(true);
      console.log('Iniciando carregamento de dados do cash flow...');
      console.log('Filtros atuais:', { dateFilterType, currentDate, selectedYear, userCostCenterId: user?.cost_center_id });
      
      // Preparar parâmetros para busca de cash flow
      const params: any = {};
      
      // Filtrar por mês/ano se aplicado
      if (dateFilterType === 'month') {
        // Corrigindo o cálculo do mês (getMonth retorna 0-11, precisamos de 1-12)
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        params.month = month.toString(); // Converter explicitamente para string
        params.year = year.toString(); // Converter explicitamente para string
        console.log('Parâmetros de filtro (mês):', { month, year });
      } else if (dateFilterType === 'year') {
        params.year = selectedYear.toString(); // Converter explicitamente para string
        console.log('Parâmetros de filtro (ano):', { year: selectedYear });
      } else if (dateFilterType === 'all') {
        // Quando mostrar todos os registros, não aplicar filtros de data
        console.log('Mostrando todos os registros (sem filtros de data)');
      } else if (dateFilterType === 'custom') {
        // Para filtros personalizados, vamos passar as datas como parâmetros
        if (customStartDate) {
          params.start_date = customStartDate.toISOString().split('T')[0];
        }
        if (customEndDate) {
          params.end_date = customEndDate.toISOString().split('T')[0];
        }
        console.log('Parâmetros de filtro (personalizado):', { start_date: params.start_date, end_date: params.end_date });
      }
      
      // Aplicar filtro de centro de custo
      if (filters.cost_center_id.length > 0) {
        // Converter para string separada por vírgula para o backend
        params.cost_center_id = filters.cost_center_id.join(',');
        console.log('Filtro de centro de custo:', params.cost_center_id);
      } else {
        // Se nenhum filtro estiver selecionado, verificar se o usuário tem um centro de custo associado
        if (user?.cost_center_id) {
          params.cost_center_id = user.cost_center_id;
          console.log('Filtro de centro de custo do usuário:', user.cost_center_id);
        } else {
          params.cost_center_id = 'all';
          console.log('Mostrando todos os centros de custo');
        }
      }
      
      console.log('Carregando dados com parâmetros:', params);
      
      const [recordsData, categoriesData, subcategoriesData, costCentersData] = await Promise.all([
        cashFlowService.list(params),
        categoryService.list(),
        subcategoryService.list(),
        costCenterService.list()
      ]);
      
      console.log('Dados recebidos:', { 
        recordsCount: recordsData.length, 
        categoriesCount: categoriesData.length,
        subcategoriesCount: subcategoriesData.length,
        costCentersCount: costCentersData.length,
        recordsData: recordsData.slice(0, 3) // Mostrar apenas os 3 primeiros registros
      });
      
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
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      console.log('Carregamento de dados concluído');
    }
  }, [dateFilterType, currentDate.toISOString(), selectedYear, JSON.stringify(filters.cost_center_id), loading, user?.cost_center_id, customStartDate, customEndDate]); // Também atualizando aqui

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    console.log('Exibindo snackbar:', { message, severity });
    setSnackbar({ open: true, message, severity });
  };

  const handleSelectRecord = (id: number | undefined) => {
    if (id === undefined) return;
    const newSelected = selectedRecords.includes(id) 
      ? selectedRecords.filter(recordId => recordId !== id)
      : [...selectedRecords, id];
    console.log('Selecionando registro:', { id, selected: newSelected.length });
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>, filteredRecords: CashFlowRecord[]) => {
    const validRecords = filteredRecords.filter(record => record.id !== undefined);
    const selected = event.target.checked ? validRecords.map(r => r.id!) : [];
    console.log('Selecionando todos os registros:', selected.length);
    setSelectedRecords(selected);
  };

  const handleSelectAllRecords = (event: React.ChangeEvent<HTMLInputElement>) => {
    const validRecords = filteredRecords.filter(record => record.id !== undefined);
    const selected = event.target.checked ? validRecords.map(r => r.id!) : [];
    console.log('Selecionando todos os registros (alternativo):', selected.length);
    setSelectedRecords(selected);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number | undefined) => {
    if (id === undefined) return;
    console.log('Abrindo menu de ações para registro:', id);
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedRecordId(id);
  };

  const handleActionMenuClose = () => {
    console.log('Fechando menu de ações');
    setActionMenuAnchorEl(null);
    setSelectedRecordId(null);
  };

  const handleNewRecord = (type: 'Despesa' | 'Receita') => {
    console.log('Criando novo registro do tipo:', type);
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category_id: '',
      subcategory_id: '',
      cost_center_id: user?.cost_center_id?.toString() || '', // Pré-preencher com o centro de custo do usuário
      record_type: type
    });
    setEditingRecord(null);
    setRecordDialogOpen(true);
    setNewRecordMenuAnchor(null);
  };

  const handleEditRecord = (record: CashFlowRecord) => {
    console.log('Editando registro:', record.id);
    setEditingRecord(record);
    const formatValueForEdit = (value: number | string): string => {
      const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

      const formatted = numericValue.toFixed(2).replace('.', ',');
      console.log('Formatando valor para edição:', { value, formatted });
      return formatted;
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
    console.log('Fechando diálogo');
    setRecordDialogOpen(false);
    setEditingRecord(null);
  };

  const handleInputChange = (field: string, value: string) => {
    console.log('Mudança de input:', { field, value });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRecord = async () => {
    try {
      const recordData = {
        description: formData.description,
        amount: parseFloat(formData.amount.replace(/\./g, '').replace(',', '.')),
        date: formData.date,
        record_type: formData.record_type as 'Despesa' | 'Receita',
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined,
        cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : undefined,
      };

      console.log('Salvando registro:', recordData);
      
      // Corrigido: verificar se editingRecord existe e tem id definido
      if (editingRecord && editingRecord.id) {
        // Atualizar registro existente
        console.log('Atualizando registro existente:', editingRecord.id);
        await cashFlowService.update(editingRecord.id, recordData);
        setSnackbar({ 
          open: true, 
          message: 'Registro atualizado com sucesso!', 
          severity: 'success' 
        });
      } else {
        // Criar novo registro
        console.log('Criando novo registro');
        await cashFlowService.create(recordData);
        setSnackbar({ 
          open: true, 
          message: 'Registro criado com sucesso!', 
          severity: 'success' 
        });
      }
      
      setRecordDialogOpen(false);
      setTimeout(() => {
        window.location.reload(); // Forçando um reload da página para atualizar os dados
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      setSnackbar({ 
        open: true, 
        message: editingRecord && editingRecord.id ? 'Erro ao atualizar registro' : 'Erro ao criar registro', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    try {
      console.log('Excluindo registro:', recordId);
      await cashFlowService.delete(recordId);
      setTimeout(() => {
        window.location.reload(); // Forçando um reload da página para atualizar os dados
      }, 500);
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
        console.log('Duplicando registro:', recordId);
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
        setTimeout(() => {
          window.location.reload(); // Forçando um reload da página para atualizar os dados
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao duplicar registro:', error);
      showSnackbar('Erro ao duplicar registro', 'error');
    }
    handleActionMenuClose();
  };

  const handleBatchDelete = async () => {
    try {
      console.log('Excluindo registros em lote:', selectedRecords.length);
      await Promise.all(selectedRecords.map(id => cashFlowService.delete(id)));
      setTimeout(() => {
        window.location.reload(); // Forçando um reload da página para atualizar os dados
      }, 500);
    } catch (error) {
      console.error('Erro ao excluir registros:', error);
      showSnackbar('Erro ao excluir registros', 'error');
    }
    setBatchActionsAnchor(null);
  };

  // Carregar dados para os filtros
  const loadFilterData = useCallback(async () => {
    try {
      console.log('Carregando dados para filtros...');
      
      // Carregar categorias
      const categoryData = await categoryService.list();
      console.log('Categorias carregadas:', categoryData.length);
      setCategories(categoryData.filter(cat => cat.id !== undefined).map(cat => ({
        ...cat,
        id: cat.id!
      })));
      
      // Carregar subcategorias
      const subcategoryData = await subcategoryService.list();
      console.log('Subcategorias carregadas:', subcategoryData.length);
      setSubcategories(subcategoryData.filter(sub => sub.id !== undefined).map(sub => ({
        ...sub,
        id: sub.id!
      })));
      
      // Carregar centros de custo
      const costCenterData = await costCenterService.list();
      console.log('Centros de custo carregados:', costCenterData.length);
      setCostCenters(costCenterData.filter(cc => cc.id !== undefined).map(cc => ({
        ...cc,
        id: cc.id!
      })));
      
    } catch (error) {
      console.error('Erro ao carregar dados para filtros:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao carregar dados para filtros', 
        severity: 'error' 
      });
    }
  }, []);

  // Carregar dados iniciais
  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      console.log('Carregando dados do cash flow (alternativo)...');
      
      // Construir parâmetros de filtro
      const params: any = {};
      
      // Adicionar filtros de data com base no tipo selecionado
      switch (dateFilterType) {
        case 'month':
          params.month = currentDate.getMonth() + 1;
          params.year = currentDate.getFullYear();
          break;
        case 'year':
          params.year = selectedYear;
          break;
        case 'custom':
          if (customStartDate) {
            params.start_date = customStartDate.toISOString().split('T')[0];
          }
          if (customEndDate) {
            params.end_date = customEndDate.toISOString().split('T')[0];
          }
          break;
        case 'all':
          // Não aplicar filtros de data
          break;
      }
      
      // Adicionar filtro de centro de custo se especificado
      if (filters.cost_center_id.length > 0) {
        params.cost_center_id = filters.cost_center_id.join(',');
      } else if (user?.cost_center_id) {
        // Se o usuário tem um centro de custo associado, usar por padrão
        params.cost_center_id = user.cost_center_id.toString();
      } else {
        // Mostrar todos os centros de custo
        params.cost_center_id = 'all';
      }

      console.log('Parâmetros da requisição:', params);
      
      const data = await cashFlowService.list(params);
      console.log('Dados recebidos (alternativo):', data.length);
      
      // Filtrar registros com id definido
      const validData: CashFlowRecord[] = data.filter(record => record.id !== undefined).map(record => ({
        ...record,
        id: record.id!
      }));
      setCashFlowRecords(validData);
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
                  onClick={handleExportToExcel}
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
                  onChange={(e) => {
                    const newValue = e.target.value as any;
                    console.log('Tipo de filtro selecionado:', newValue);
                    setDateFilterType(newValue);
                  }}
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
                      onChange={(newValue) => {
                        if (newValue) {
                          console.log('Data selecionada:', newValue);
                          console.log('Mês:', newValue.getMonth() + 1);
                          console.log('Ano:', newValue.getFullYear());
                          setCurrentDate(newValue);
                          // Removendo o timeout e deixando o useEffect cuidar do carregamento
                        }
                      }}
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

              {/* Year selector for year filter */}
              {dateFilterType === 'year' && (
                <Box sx={{ minWidth: 120, flex: '0 0 auto' }}>
                  <DatePicker
                    views={['year']}
                    label="Ano"
                    value={new Date(selectedYear, 0, 1)}
                    onChange={(newValue) => {
                      if (newValue) {
                        console.log('Ano selecionado:', newValue.getFullYear());
                        setSelectedYear(newValue.getFullYear());
                      }
                    }}
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
                      onChange={(newValue) => {
                        console.log('Data inicial selecionada:', newValue);
                        setCustomStartDate(newValue);
                      }}
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
                      onChange={(newValue) => {
                        console.log('Data final selecionada:', newValue);
                        setCustomEndDate(newValue);
                      }}
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
                  onChange={(e) => {
                    const newValue = e.target.value as string[];
                    console.log('Tipos de registro selecionados:', newValue);
                    setFilters(prev => ({ ...prev, record_type: newValue }));
                  }}
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
                  onChange={(e) => {
                    const newValue = e.target.value as string[];
                    console.log('Categorias selecionadas:', newValue);
                    setFilters(prev => ({ ...prev, category_id: newValue }));
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
                  onChange={(e) => {
                    const newValue = e.target.value as string[];
                    console.log('Subcategorias selecionadas:', newValue);
                    setFilters(prev => ({ ...prev, subcategory_id: newValue }));
                  }}
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
                  onChange={(e) => {
                    const newValue = e.target.value as string[];
                    console.log('Centros de custo selecionados:', newValue);
                    setFilters(prev => ({ ...prev, cost_center_id: newValue }));
                  }}
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
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ color: colors.gray[600], fontWeight: 500 }}>
              {selectedRecords.length} de {filteredRecords.length} registro(s) selecionado(s)
            </Typography>
            {selectedRecords.length > 0 && (
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
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '30%' }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '15%' }} align="right">Valor (R$)</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700], bgcolor: colors.gray[50], borderBottom: `2px solid ${colors.gray[200]}`, width: '25%' }}>Centro de Custo</TableCell>
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
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma transação encontrada para este período
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRecords.includes(record.id!)}
                          onChange={() => handleSelectRecord(record.id)}
                          sx={{ color: colors.gray[400], '&.Mui-checked': { color: colors.primary[600] } }}
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
        </Box>
      </Box>
    </LocalizationProvider>
  );
}