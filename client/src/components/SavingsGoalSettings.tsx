import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Paper,
  Autocomplete,
} from '@mui/material';
import { ShowChart as ShowChartIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import api from '../lib/axios';
import { savingsGoalService, SavingsGoal } from '../services/savingsGoalService';
import { colors } from '../theme/modernTheme';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateString, formatDateToLocal, createSafeDate } from '../utils/dateUtils';

interface CostCenter {
  id: number;
  name: string;
  number?: string;
}

export const SavingsGoalSettings: React.FC = () => {
  const { user } = useAuth();
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(null);
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Carregar centros de custo
  useEffect(() => {
    const loadCostCenters = async () => {
      try {
        const response = await api.get('/cost-centers');
        setCostCenters(response.data);
      } catch (error) {
        console.error('Erro ao carregar centros de custo:', error);
        showSnackbar('Erro ao carregar centros de custo', 'error');
      }
    };
    
    loadCostCenters();
  }, []);
  
  // Carregar meta de economia
  useEffect(() => {
    loadSavingsGoal();
    
    // Se o usuário tiver um centro de custo associado, selecioná-lo automaticamente
    if (user?.cost_center_id) {
      const userCostCenter = costCenters.find((cc: CostCenter) => cc.id === user.cost_center_id);
      if (userCostCenter) {
        setSelectedCostCenter(userCostCenter);
      }
    }
  }, [user, costCenters]);
  
  const loadSavingsGoal = async () => {
    try {
      setLoading(true);
      const goal = await savingsGoalService.get();
      if (goal) {
        setSavingsGoal(goal);
        
        // Formatar o valor da meta para o formato brasileiro
        const formattedAmount = goal.target_amount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        setTargetAmount(formattedAmount);
        
        // Converter a data usando createSafeDate para evitar problemas de timezone
        setTargetDate(goal.target_date ? createSafeDate(goal.target_date) : null);
        
        // Definir o centro de custo selecionado
        if (goal.cost_center_id) {
          const costCenter = costCenters.find(cc => cc.id === goal.cost_center_id);
          if (costCenter) {
            setSelectedCostCenter(costCenter);
          }
        }
        // Se não houver centro de custo na meta, mas o usuário tem um associado, usar o do usuário
        else if (user?.cost_center_id) {
          const userCostCenter = costCenters.find(cc => cc.id === user.cost_center_id);
          if (userCostCenter) {
            setSelectedCostCenter(userCostCenter);
          }
        }
      }
      // Se não houver meta ainda, mas o usuário tem centro de custo, pré-selecionar
      else if (user?.cost_center_id) {
        const userCostCenter = costCenters.find(cc => cc.id === user.cost_center_id);
        if (userCostCenter) {
          setSelectedCostCenter(userCostCenter);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar meta de economia:', error);
      showSnackbar('Erro ao carregar meta de economia', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
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
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validar dados
      if (!targetAmount || !targetDate) {
        showSnackbar('Preencha todos os campos', 'error');
        return;
      }
      
      const amount = parseBrazilianNumber(targetAmount);
      if (isNaN(amount) || amount <= 0) {
        showSnackbar('Valor da meta inválido', 'error');
        return;
      }
      
      // Usar formatDateToLocal para evitar problema d-1 de timezone
      const formattedDate = formatDateToLocal(targetDate);
      
      // Sempre usar o centro de custo do usuário logado
      const goalData = {
        target_amount: amount,
        target_date: formattedDate,
        cost_center_id: user?.cost_center_id || selectedCostCenter?.id
      };
      
      const savedGoal = await savingsGoalService.save(goalData);
      setSavingsGoal(savedGoal);
      
      showSnackbar('Meta de economia salva com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar meta de economia:', error);
      showSnackbar('Erro ao salvar meta de economia', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ShowChartIcon sx={{ mr: 1, color: colors.primary[500], fontSize: 28 }} />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Configuração de Meta de Economia
          </Typography>
        </Box>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            border: `1px solid ${colors.gray[200]}`,
            maxWidth: 600
          }}
        >
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)'
            },
            gap: 2
          }}>
            {/* Campo de Valor - Igual ao do cadastro de transações */}
            <Box>
              <TextField
                label="Valor da Meta"
                type="text"
                value={targetAmount}
                onChange={(e) => {
                  // Permite apenas números, vírgula e ponto
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setTargetAmount(value);
                }}
                onBlur={(e) => {
                  // Formatar o valor quando perder o foco
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  if (value) {
                    const numericValue = parseBrazilianNumber(value);
                    if (!isNaN(numericValue) && numericValue >= 0) {
                      const formattedValue = numericValue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      });
                      setTargetAmount(formattedValue);
                    }
                  }
                }}
                onFocus={(e) => {
                  // Converter para formato de edição (sem formatação de milhares)
                  const value = e.target.value;
                  if (value) {
                    const numericValue = parseBrazilianNumber(value);
                    if (!isNaN(numericValue)) {
                      // Converte para formato editável (sem pontos de milhar)
                      const editableValue = numericValue.toFixed(2).replace('.', ',');
                      setTargetAmount(editableValue);
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: '#FFFFFF',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300]
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500]
                    }
                  }
                }}
              />
            </Box>
            
            {/* Campo de Data - Estilo moderno */}
            <Box>
              <DatePicker
                label="Data Alvo"
                value={targetDate}
                onChange={(newValue) => setTargetDate(newValue)}
                slotProps={{
                  textField: { 
                    size: 'small',
                    fullWidth: true,
                    required: true,
                    sx: { 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: '#FFFFFF',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.primary[300]
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.primary[500]
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
            
            {/* Campo de Centro de Custo - Somente leitura, mostra o centro de custo do usuário */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                label="Centro de Custo"
                value={selectedCostCenter 
                  ? `${selectedCostCenter.name}${selectedCostCenter.number ? ` (${selectedCostCenter.number})` : ''}` 
                  : 'Nenhum centro de custo associado'}
                fullWidth
                size="small"
                disabled
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: '#FFFFFF',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300]
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500]
                    }
                  }
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{ 
                bgcolor: colors.primary[600],
                '&:hover': {
                  bgcolor: colors.primary[700]
                },
                borderRadius: 1.5,
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
              }}
            >
              {loading ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </Box>
        </Paper>
        
        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};