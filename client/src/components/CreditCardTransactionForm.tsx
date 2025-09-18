import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import { transactionService, Transaction } from '../services/transactionService';
import { cardService, Card } from '../services/cardService';
import { categoryService, Category } from '../services/categoryService';

interface CreditCardTransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function CreditCardTransactionForm({ open, onClose, onSubmit }: CreditCardTransactionFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date(),
    description: '',
    amount: '',
    categoryId: '',
    cardId: '',
    isInstallment: false,
    installments: 1,
  });

  // Carregar cartões e categorias
  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          setLoading(true);
          const [cardsData, categoriesData] = await Promise.all([
            cardService.list(),
            categoryService.list()
          ]);
          setCards(cardsData);
          setCategories(categoriesData.filter(cat => cat.source_type === 'Despesa'));
        } catch (err) {
          setError('Erro ao carregar dados');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [open]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar campos obrigatórios
      if (!formData.description || !formData.amount || !formData.categoryId || !formData.cardId) {
        setError('Todos os campos são obrigatórios');
        setLoading(false);
        return;
      }

      // Encontrar o cartão selecionado
      const selectedCard = cards.find(card => card.id === parseInt(formData.cardId));
      
      // Converter dados para o formato da transação
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
      
      // Se for parcelado, dividir o valor pelo número de parcelas
      const transactionAmount = formData.isInstallment 
        ? amount / formData.installments 
        : amount;

      // Determinar a data correta com base na data de fechamento do cartão
      let transactionDate = new Date(formData.date);
      
      if (selectedCard && selectedCard.closing_day) {
        const transactionDay = transactionDate.getDate();
        
        // Se a data da transação for maior ou igual à data de fechamento,
        // calcular para o próximo mês (próxima fatura)
        if (transactionDay >= selectedCard.closing_day) {
          transactionDate.setMonth(transactionDate.getMonth() + 1);
        }
      }

      // Criar a transação principal
      const transactionData: Omit<Transaction, 'id'> = {
        description: formData.description,
        amount: transactionAmount,
        transaction_type: 'Despesa',
        category_id: parseInt(formData.categoryId),
        transaction_date: transactionDate.toISOString().split('T')[0],
        is_recurring: false,
      };

      await transactionService.create(transactionData);
      
      // Se for parcelado, criar as transações restantes
      if (formData.isInstallment && formData.installments > 1) {
        for (let i = 2; i <= formData.installments; i++) {
          // Para parcelas subsequentes, adicionar meses
          const installmentDate = new Date(transactionDate);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
          
          const installmentTransaction: Omit<Transaction, 'id'> = {
            ...transactionData,
            description: `${formData.description} (${i}/${formData.installments})`,
            transaction_date: installmentDate.toISOString().split('T')[0],
          };
          await transactionService.create(installmentTransaction);
        }
      }

      onSubmit();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar transação');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        pb: 1,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #e0e0e0'
      }}>
        Nova Transação de Cartão de Crédito
      </DialogTitle>
      
      <DialogContent sx={{ 
        pt: 2,
        bgcolor: '#FFFFFF'
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? 1.5 : 2
        }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DatePicker
              label="Data"
              value={formData.date}
              onChange={(newValue) => newValue && handleChange('date', newValue)}
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  margin: "dense", 
                  required: true,
                  size: isMobile ? "small" : "medium"
                } 
              }}
            />
          </LocalizationProvider>
          
          <TextField
            label="Descrição"
            fullWidth
            margin="dense"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            size={isMobile ? "small" : "medium"}
          />
          
          <TextField
            label="Valor Total"
            type="text"
            fullWidth
            margin="dense"
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
                  setFormData(prev => ({ ...prev, amount: editableValue }));
                }
              }
            }}
            required
            InputProps={{
              startAdornment: <Box sx={{ mr: 1 }}>R$</Box>
            }}
            placeholder="0,00"
            helperText="Use vírgula para decimais (ex: 1.666,00)"
            size={isMobile ? "small" : "medium"}
          />
          
          <FormControl fullWidth margin="dense" required size={isMobile ? "small" : "medium"}>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={formData.categoryId}
              label="Categoria"
              onChange={(e) => handleChange('categoryId', e.target.value)}
              size={isMobile ? "small" : "medium"}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense" required size={isMobile ? "small" : "medium"}>
            <InputLabel>Cartão</InputLabel>
            <Select
              value={formData.cardId}
              label="Cartão"
              onChange={(e) => handleChange('cardId', e.target.value)}
              size={isMobile ? "small" : "medium"}
            >
              {cards.map((card) => (
                <MenuItem key={card.id} value={card.id}>
                  {card.name} ({card.brand}) - Fecha dia {card.closing_day || '-'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mt: 1
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isInstallment}
                  onChange={(e) => handleChange('isInstallment', e.target.checked)}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    color: '#3b82f6',
                    '&.Mui-checked': {
                      color: '#3b82f6',
                    },
                  }}
                />
              }
              label="Compra parcelada"
              sx={{
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: 500,
                  color: '#374151'
                }
              }}
            />
            
            {formData.isInstallment && (
              <TextField
                label="Parcelas"
                type="number"
                value={formData.installments}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir campo vazio ou valores numéricos
                  if (value === '' || (!isNaN(parseInt(value)) && parseInt(value) >= 0)) {
                    setFormData(prev => ({ ...prev, installments: value === '' ? 1 : parseInt(value) }));
                  }
                }}
                onBlur={(e) => {
                  // Quando sair do campo, se estiver vazio, definir como 1
                  const value = e.target.value;
                  if (!value) {
                    setFormData(prev => ({ ...prev, installments: 1 }));
                  }
                }}
                size={isMobile ? "small" : "medium"}
                inputProps={{ 
                  min: 1, 
                  max: 360,
                  style: { 
                    padding: isMobile ? '8px 12px' : '12px 14px',
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
                sx={{ 
                  width: '120px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9ca3af',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  }
                }}
              />
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2,
        bgcolor: '#FFFFFF',
        borderTop: '1px solid #e0e0e0'
      }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          size={isMobile ? "small" : "medium"}
          sx={{
            color: '#6b7280',
            '&:hover': {
              backgroundColor: '#f3f4f6'
            }
          }}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          size={isMobile ? "small" : "medium"}
          onClick={handleSubmit as any}
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': {
              bgcolor: '#2563eb'
            },
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreditCardTransactionForm;