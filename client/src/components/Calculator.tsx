import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  Percent as PercentIcon,
  AccountBalance as BankIcon,
  LocalOffer as DiscountIcon,
  TrendingUp as InvestmentIcon,
} from '@mui/icons-material';
import { ModernCard, ModernSection, ModernHeader } from './modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';

interface CalculatorProps {
  onClose?: () => void;
}

// Definindo o tipo para os botões da calculadora
interface CalculatorButton {
  label: string;
  type: 'number' | 'operator' | 'function' | 'clear' | 'equals' | 'decimal';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  value?: string;
  span?: number;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  
  // Financial calculations state
  const [percentage, setPercentage] = useState('');
  const [percentageBase, setPercentageBase] = useState('');
  const [percentageResult, setPercentageResult] = useState('');
  
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [interestResult, setInterestResult] = useState('');

  // Discount calculation
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountResult, setDiscountResult] = useState('');

  // Investment calculation
  const [monthlyInvestment, setMonthlyInvestment] = useState('');
  const [investmentRate, setInvestmentRate] = useState('');
  const [investmentTime, setInvestmentTime] = useState('');
  const [investmentResult, setInvestmentResult] = useState('');

  const [copyMessage, setCopyMessage] = useState('');

  const inputNumber = useCallback((num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForNewValue]);

  const inputDecimal = useCallback(() => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  }, [display, waitingForNewValue]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  }, []);

  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result: number;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '*':
          result = currentValue * inputValue;
          break;
        case '/':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        case '=':
          result = inputValue;
          break;
        default:
          return;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation]);

  const calculate = useCallback(() => {
    performOperation('=');
    setOperation(null);
    setPreviousValue(null);
    setWaitingForNewValue(true);
  }, [performOperation]);

  // Financial calculation functions
  const calculatePercentage = useCallback(() => {
    const percent = parseFloat(percentage);
    const base = parseFloat(percentageBase);
    
    if (!isNaN(percent) && !isNaN(base)) {
      const result = (percent / 100) * base;
      setPercentageResult(result.toFixed(2));
    }
  }, [percentage, percentageBase]);

  const calculateInterest = useCallback(() => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100; // Convert percentage to decimal
    const t = parseFloat(time);
    
    if (!isNaN(p) && !isNaN(r) && !isNaN(t)) {
      const simpleInterest = p * r * t;
      const compoundInterest = p * Math.pow(1 + r, t) - p;
      setInterestResult(`Juros Simples: R$ ${simpleInterest.toFixed(2)} | Juros Compostos: R$ ${compoundInterest.toFixed(2)}`);
    }
  }, [principal, rate, time]);

  const calculateDiscount = useCallback(() => {
    const price = parseFloat(originalPrice);
    const discount = parseFloat(discountPercent);
    
    if (!isNaN(price) && !isNaN(discount)) {
      const discountAmount = (discount / 100) * price;
      const finalPrice = price - discountAmount;
      setDiscountResult(`Desconto: R$ ${discountAmount.toFixed(2)} | Preço Final: R$ ${finalPrice.toFixed(2)}`);
    }
  }, [originalPrice, discountPercent]);

  const calculateInvestment = useCallback(() => {
    const monthly = parseFloat(monthlyInvestment);
    const annualRate = parseFloat(investmentRate) / 100;
    const years = parseFloat(investmentTime);
    
    if (!isNaN(monthly) && !isNaN(annualRate) && !isNaN(years)) {
      const monthlyRate = annualRate / 12;
      const months = years * 12;
      const totalInvested = monthly * months;
      const futureValue = monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate);
      const profit = futureValue - totalInvested;
      
      setInvestmentResult(`Investido: R$ ${totalInvested.toFixed(2)} | Valor Final: R$ ${futureValue.toFixed(2)} | Lucro: R$ ${profit.toFixed(2)}`);
    }
  }, [monthlyInvestment, investmentRate, investmentTime]);

  const copyToClipboard = useCallback((value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopyMessage('Valor copiado!');
      setTimeout(() => setCopyMessage(''), 2000);
    });
  }, []);

  const handleButtonClick = (btn: CalculatorButton) => {
    const buttonValue = btn.value || btn.label;
    
    if (buttonValue === 'C') {
      clear();
    } else if (buttonValue === '=') {
      calculate();
    } else if (['+', '-', '*', '/'].includes(buttonValue)) {
      performOperation(buttonValue);
    } else if (buttonValue === '.') {
      inputDecimal();
    } else if (buttonValue === '±') {
      setDisplay(String(parseFloat(display) * -1));
    } else if (buttonValue === '%') {
      setDisplay(String(parseFloat(display) / 100));
    } else {
      inputNumber(buttonValue);
    }
  };

  // Calculator button configuration
  const calculatorButtons: CalculatorButton[][] = [
    [
      { label: 'C', type: 'clear', color: 'error' },
      { label: '±', type: 'function' },
      { label: '%', type: 'function' },
      { label: '÷', type: 'operator', value: '/' }
    ],
    [
      { label: '7', type: 'number' },
      { label: '8', type: 'number' },
      { label: '9', type: 'number' },
      { label: '×', type: 'operator', value: '*' }
    ],
    [
      { label: '4', type: 'number' },
      { label: '5', type: 'number' },
      { label: '6', type: 'number' },
      { label: '−', type: 'operator', value: '-' }
    ],
    [
      { label: '1', type: 'number' },
      { label: '2', type: 'number' },
      { label: '3', type: 'number' },
      { label: '+', type: 'operator', value: '+' }
    ],
    [
      { label: '0', type: 'number', span: 2 },
      { label: '.', type: 'decimal' },
      { label: '=', type: 'equals', color: 'primary' }
    ]
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: colors.gray[50],
      p: isMobile ? 1 : 2
    }}>
      <ModernHeader 
        title="Calculadora Financeira"
        subtitle="Ferramentas para cálculos financeiros avançados"
        breadcrumbs={[
          { label: 'TrackeOne Finance', href: '/' },
          { label: 'Calculadora' }
        ]}
        actions={onClose ? (
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={onClose}
            sx={{
              borderColor: colors.error[200],
              color: colors.error[700],
              '&:hover': {
                borderColor: colors.error[300],
                backgroundColor: colors.error[50]
              }
            }}
          >
            Fechar
          </Button>
        ) : undefined}
      />
      
      <Box sx={{ 
        maxWidth: 1200, 
        mx: 'auto',
        mt: 2
      }}>
        <ModernCard sx={{ p: isMobile ? 1.5 : 2 }}>
          {copyMessage && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: isMobile ? 1.5 : 2,
                borderRadius: 1,
                '& .MuiAlert-icon': {
                  color: colors.success[600]
                },
                py: 0.5,
                px: 1.5
              }}
            >
              <Typography variant="body2">{copyMessage}</Typography>
            </Alert>
          )}

          {/* Basic Calculator */}
          <ModernSection 
            title="Calculadora Básica"
            icon={<CalculateIcon sx={{ fontSize: '1rem' }} />}
            sx={{ mb: isMobile ? 1.5 : 2, p: isMobile ? 1 : 1.5 }}
          >
            <TextField
              fullWidth
              value={display}
              variant="outlined"
              sx={{ 
                mb: isMobile ? 1 : 1.5,
                '& .MuiInputBase-root': {
                  height: isMobile ? 50 : 60,
                  fontSize: isMobile ? '1.3rem' : '1.5rem',
                  fontWeight: 600,
                  textAlign: 'right',
                  backgroundColor: colors.gray[50],
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: colors.gray[300],
                    borderWidth: 1
                  },
                  '&:hover fieldset': {
                    borderColor: colors.primary[400]
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary[600],
                    borderWidth: 1
                  }
                }
              }}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Tooltip title="Copiar valor">
                    <IconButton 
                      onClick={() => copyToClipboard(display)}
                      size="small"
                      sx={{
                        color: colors.gray[500],
                        '&:hover': {
                          backgroundColor: colors.primary[50],
                          color: colors.primary[600]
                        }
                      }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />

            {/* Calculator Buttons */}
            <Stack spacing={isMobile ? 0.75 : 1}>
              {calculatorButtons.map((row, rowIndex) => (
                <Stack 
                  key={rowIndex} 
                  direction="row" 
                  spacing={isMobile ? 0.75 : 1}
                  sx={{ 
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {row.map((btn, btnIndex) => (
                    <Button
                      key={btnIndex}
                      fullWidth
                      variant={
                        btn.type === 'number' || btn.type === 'decimal' ? 'outlined' : 
                        'contained'
                      }
                      color={btn.color as any || (btn.type === 'operator' || btn.type === 'equals' ? 'primary' : undefined)}
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        height: isMobile ? 40 : 48,
                        borderRadius: 1,
                        fontWeight: 600,
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        backgroundColor: btn.type === 'number' || btn.type === 'decimal' ? '#ffffff' : undefined,
                        color: btn.type === 'number' || btn.type === 'decimal' ? colors.gray[800] : undefined,
                        borderColor: btn.type === 'number' || btn.type === 'decimal' ? colors.gray[300] : undefined,
                        borderWidth: btn.type === 'number' || btn.type === 'decimal' ? 1 : undefined,
                        borderStyle: btn.type === 'number' || btn.type === 'decimal' ? 'solid' : undefined,
                        boxShadow: btn.type === 'number' || btn.type === 'decimal' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : undefined,
                        '&:hover': {
                          backgroundColor: btn.type === 'number' || btn.type === 'decimal' ? colors.gray[50] : undefined,
                          borderColor: btn.type === 'number' || btn.type === 'decimal' ? colors.primary[300] : undefined,
                          boxShadow: btn.type === 'number' || btn.type === 'decimal' ? shadows.sm : undefined
                        },
                        flex: btn.span === 2 ? 2 : 1
                      }}
                      onClick={() => handleButtonClick(btn)}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </Stack>
              ))}
            </Stack>
          </ModernSection>

          <Divider sx={{ my: isMobile ? 1.5 : 2, borderColor: colors.gray[200] }} />

          {/* Financial Calculators */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? 1 : 1.5
          }}>
            <Accordion 
              sx={{ 
                borderRadius: 1,
                border: `1px solid ${colors.gray[200]}`,
                boxShadow: 'none',
                '&:before': {
                  display: 'none'
                },
                mb: isMobile ? 1 : 1.5
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: 1,
                  '&.Mui-expanded': {
                    borderRadius: '4px 4px 0 0'
                  },
                  backgroundColor: colors.gray[50],
                  minHeight: isMobile ? 36 : 48,
                  '& .MuiAccordionSummary-content': {
                    margin: isMobile ? '8px 0' : '12px 0'
                  },
                  '&:hover': {
                    backgroundColor: colors.gray[100]
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PercentIcon sx={{ mr: 0.75, color: colors.primary[600], fontSize: isMobile ? '1rem' : '1.2rem' }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '1rem' }}>
                    Porcentagem
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: isMobile ? 1 : 1.5 }}>
                <Stack spacing={isMobile ? 1 : 1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={isMobile ? 0.75 : 1}>
                    <TextField
                      fullWidth
                      label="%"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Valor"
                      value={percentageBase}
                      onChange={(e) => setPercentageBase(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={calculatePercentage}
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        minWidth: isMobile ? 70 : 80, 
                        borderRadius: 1,
                        background: gradients.primary,
                        boxShadow: shadows.colored.primary,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                          boxShadow: shadows.lg
                        }
                      }}
                    >
                      =
                    </Button>
                  </Stack>
                  {percentageResult && (
                    <TextField
                      fullWidth
                      label="Resultado"
                      value={`R$ ${percentageResult}`}
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Tooltip title="Copiar resultado">
                            <IconButton 
                              onClick={() => copyToClipboard(percentageResult)}
                              size="small"
                              sx={{
                                color: colors.gray[500],
                                '&:hover': {
                                  backgroundColor: colors.primary[50],
                                  color: colors.primary[600]
                                }
                              }}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ),
                        sx: {
                          borderRadius: 1,
                          backgroundColor: colors.success[50]
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion 
              sx={{ 
                borderRadius: 1,
                border: `1px solid ${colors.gray[200]}`,
                boxShadow: 'none',
                '&:before': {
                  display: 'none'
                },
                mb: isMobile ? 1 : 1.5
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: 1,
                  '&.Mui-expanded': {
                    borderRadius: '4px 4px 0 0'
                  },
                  backgroundColor: colors.gray[50],
                  minHeight: isMobile ? 36 : 48,
                  '& .MuiAccordionSummary-content': {
                    margin: isMobile ? '8px 0' : '12px 0'
                  },
                  '&:hover': {
                    backgroundColor: colors.gray[100]
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BankIcon sx={{ mr: 0.75, color: colors.primary[600], fontSize: isMobile ? '1rem' : '1.2rem' }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '1rem' }}>
                    Juros
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: isMobile ? 1 : 1.5 }}>
                <Stack spacing={isMobile ? 1 : 1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={isMobile ? 0.75 : 1}>
                    <TextField
                      fullWidth
                      label="Capital"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Taxa %"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Anos"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={calculateInterest}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      height: isMobile ? 36 : 40,
                      borderRadius: 1,
                      background: gradients.primary,
                      boxShadow: shadows.colored.primary,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        boxShadow: shadows.lg
                      }
                    }}
                  >
                    Calcular
                  </Button>
                  {interestResult && (
                    <TextField
                      fullWidth
                      label="Resultado"
                      value={interestResult}
                      multiline
                      rows={2}
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Tooltip title="Copiar resultado">
                            <IconButton 
                              onClick={() => copyToClipboard(interestResult)}
                              size="small"
                              sx={{
                                color: colors.gray[500],
                                '&:hover': {
                                  backgroundColor: colors.primary[50],
                                  color: colors.primary[600]
                                }
                              }}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ),
                        sx: {
                          borderRadius: 1,
                          backgroundColor: colors.success[50]
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion 
              sx={{ 
                borderRadius: 1,
                border: `1px solid ${colors.gray[200]}`,
                boxShadow: 'none',
                '&:before': {
                  display: 'none'
                },
                mb: isMobile ? 1 : 1.5
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: 1,
                  '&.Mui-expanded': {
                    borderRadius: '4px 4px 0 0'
                  },
                  backgroundColor: colors.gray[50],
                  minHeight: isMobile ? 36 : 48,
                  '& .MuiAccordionSummary-content': {
                    margin: isMobile ? '8px 0' : '12px 0'
                  },
                  '&:hover': {
                    backgroundColor: colors.gray[100]
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DiscountIcon sx={{ mr: 0.75, color: colors.primary[600], fontSize: isMobile ? '1rem' : '1.2rem' }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '1rem' }}>
                    Desconto
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: isMobile ? 1 : 1.5 }}>
                <Stack spacing={isMobile ? 1 : 1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={isMobile ? 0.75 : 1}>
                    <TextField
                      fullWidth
                      label="Preço"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Desconto %"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={calculateDiscount}
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        minWidth: isMobile ? 70 : 80, 
                        borderRadius: 1,
                        background: gradients.primary,
                        boxShadow: shadows.colored.primary,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                          boxShadow: shadows.lg
                        }
                      }}
                    >
                      =
                    </Button>
                  </Stack>
                  {discountResult && (
                    <TextField
                      fullWidth
                      label="Resultado"
                      value={discountResult}
                      multiline
                      rows={2}
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Tooltip title="Copiar resultado">
                            <IconButton 
                              onClick={() => copyToClipboard(discountResult)}
                              size="small"
                              sx={{
                                color: colors.gray[500],
                                '&:hover': {
                                  backgroundColor: colors.primary[50],
                                  color: colors.primary[600]
                                }
                              }}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ),
                        sx: {
                          borderRadius: 1,
                          backgroundColor: colors.success[50]
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion 
              sx={{ 
                borderRadius: 1,
                border: `1px solid ${colors.gray[200]}`,
                boxShadow: 'none',
                '&:before': {
                  display: 'none'
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: 1,
                  '&.Mui-expanded': {
                    borderRadius: '4px 4px 0 0'
                  },
                  backgroundColor: colors.gray[50],
                  minHeight: isMobile ? 36 : 48,
                  '& .MuiAccordionSummary-content': {
                    margin: isMobile ? '8px 0' : '12px 0'
                  },
                  '&:hover': {
                    backgroundColor: colors.gray[100]
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InvestmentIcon sx={{ mr: 0.75, color: colors.primary[600], fontSize: isMobile ? '1rem' : '1.2rem' }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '1rem' }}>
                    Investimento
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: isMobile ? 1 : 1.5 }}>
                <Stack spacing={isMobile ? 1 : 1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={isMobile ? 0.75 : 1}>
                    <TextField
                      fullWidth
                      label="Mensal"
                      value={monthlyInvestment}
                      onChange={(e) => setMonthlyInvestment(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Taxa %"
                      value={investmentRate}
                      onChange={(e) => setInvestmentRate(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Anos"
                      value={investmentTime}
                      onChange={(e) => setInvestmentTime(e.target.value)}
                      type="number"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={calculateInvestment}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      height: isMobile ? 36 : 40,
                      borderRadius: 1,
                      background: gradients.primary,
                      boxShadow: shadows.colored.primary,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        boxShadow: shadows.lg
                      }
                    }}
                  >
                    Simular
                  </Button>
                  {investmentResult && (
                    <TextField
                      fullWidth
                      label="Resultado"
                      value={investmentResult}
                      multiline
                      rows={2}
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Tooltip title="Copiar resultado">
                            <IconButton 
                              onClick={() => copyToClipboard(investmentResult)}
                              size="small"
                              sx={{
                                color: colors.gray[500],
                                '&:hover': {
                                  backgroundColor: colors.primary[50],
                                  color: colors.primary[600]
                                }
                              }}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ),
                        sx: {
                          borderRadius: 1,
                          backgroundColor: colors.success[50]
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        </ModernCard>
      </Box>
    </Box>
  );
};

export default Calculator;