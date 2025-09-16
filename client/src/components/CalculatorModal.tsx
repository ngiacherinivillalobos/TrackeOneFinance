import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Fade,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Calculate as CalculateIcon,
  Percent as PercentIcon,
  AccountBalance as BankIcon,
  LocalOffer as DiscountIcon,
  TrendingUp as InvestmentIcon,
} from '@mui/icons-material';
import { useCalculator } from '../contexts/CalculatorContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`calculator-tabpanel-${index}`}
      aria-labelledby={`calculator-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CalculatorModal: React.FC = () => {
  const { isOpen, closeCalculator } = useCalculator();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Financial calculations state
  const [percentage, setPercentage] = useState('');
  const [percentageBase, setPercentageBase] = useState('');
  const [percentageResult, setPercentageResult] = useState('');
  
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [interestResult, setInterestResult] = useState('');

  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountResult, setDiscountResult] = useState('');

  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentRate, setInvestmentRate] = useState('');
  const [investmentTime, setInvestmentTime] = useState('');
  const [investmentResult, setInvestmentResult] = useState('');

  const [copyAlert, setCopyAlert] = useState(false);

  // Reset all values when modal opens
  useEffect(() => {
    if (isOpen) {
      resetCalculator();
    }
  }, [isOpen]);

  const resetCalculator = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
    setTabValue(0);
    setPercentage('');
    setPercentageBase('');
    setPercentageResult('');
    setPrincipal('');
    setRate('');
    setTime('');
    setInterestResult('');
    setOriginalPrice('');
    setDiscountPercent('');
    setDiscountResult('');
    setInvestmentAmount('');
    setInvestmentRate('');
    setInvestmentTime('');
    setInvestmentResult('');
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Basic calculator functions
  const inputNumber = useCallback((num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForNewValue]);

  const inputOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation]);

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleButtonClick = (button: string) => {
    if (button >= '0' && button <= '9' || button === '.') {
      inputNumber(button);
    } else if (['+', '-', '*', '/'].includes(button)) {
      inputOperation(button);
    } else if (button === '=') {
      performCalculation();
    } else if (button === 'C') {
      clearDisplay();
    } else if (button === '±') {
      setDisplay((parseFloat(display) * -1).toString());
    } else if (button === '%') {
      setDisplay((parseFloat(display) / 100).toString());
    }
  };

  // Keyboard support for basic calculator
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || tabValue !== 0) return; // Only work on basic calculator tab

      const { key, ctrlKey } = event;
      event.preventDefault();

      if (ctrlKey && key === 'Escape') {
        closeCalculator();
        return;
      }

      if (key >= '0' && key <= '9') {
        inputNumber(key);
      } else if (key === '.' || key === ',') {
        if (!display.includes('.')) {
          inputNumber('.');
        }
      } else if (['+', '-', '*', '/'].includes(key)) {
        inputOperation(key);
      } else if (key === 'Enter' || key === '=') {
        performCalculation();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
      } else if (key === 'Backspace') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
    };

    if (isOpen && tabValue === 0) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, tabValue, display, inputNumber, inputOperation, closeCalculator]);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyAlert(true);
      setTimeout(() => setCopyAlert(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const calculatePercentage = () => {
    const base = parseFloat(percentageBase);
    const percent = parseFloat(percentage);
    if (!isNaN(base) && !isNaN(percent)) {
      const result = (base * percent) / 100;
      setPercentageResult(result.toFixed(2));
    }
  };

  const calculateInterest = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const t = parseFloat(time);
    
    if (!isNaN(p) && !isNaN(r) && !isNaN(t)) {
      const simpleInterest = (p * r * t) / 100;
      const compound = p * Math.pow((1 + r / 100), t);
      setInterestResult(`Juros Simples: R$ ${simpleInterest.toFixed(2)} | Juros Compostos: R$ ${compound.toFixed(2)}`);
    }
  };

  const calculateDiscount = () => {
    const price = parseFloat(originalPrice);
    const discount = parseFloat(discountPercent);
    
    if (!isNaN(price) && !isNaN(discount)) {
      const discountAmount = (price * discount) / 100;
      const finalPrice = price - discountAmount;
      setDiscountResult(`Desconto: R$ ${discountAmount.toFixed(2)} | Preço Final: R$ ${finalPrice.toFixed(2)}`);
    }
  };

  const calculateInvestment = () => {
    const amount = parseFloat(investmentAmount);
    const rateInv = parseFloat(investmentRate);
    const timeInv = parseFloat(investmentTime);
    
    if (!isNaN(amount) && !isNaN(rateInv) && !isNaN(timeInv)) {
      const finalAmount = amount * Math.pow((1 + rateInv / 100), timeInv);
      const profit = finalAmount - amount;
      setInvestmentResult(`Valor Final: R$ ${finalAmount.toFixed(2)} | Lucro: R$ ${profit.toFixed(2)}`);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={closeCalculator}
      maxWidth="sm"
      PaperProps={{
        sx: {
          height: 'auto',
          maxHeight: 'none',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          '& .MuiDialogContent-root': {
            padding: 0,
            overflow: 'hidden',
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" component="div" sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontWeight: 500,
          color: 'text.primary'
        }}>
          <CalculateIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
          Calculadora
        </Typography>
        <IconButton 
          onClick={closeCalculator} 
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="calculator tabs"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiTabs-indicator': {
                  height: 2,
                }
              }}
            >
              <Tab 
                icon={<CalculateIcon />} 
                label="Básica" 
                id="calculator-tab-0"
                aria-controls="calculator-tabpanel-0"
              />
              <Tab 
                icon={<PercentIcon />} 
                label="Porcentagem" 
                id="calculator-tab-1"
                aria-controls="calculator-tabpanel-1"
              />
              <Tab 
                icon={<BankIcon />} 
                label="Juros" 
                id="calculator-tab-2"
                aria-controls="calculator-tabpanel-2"
              />
              <Tab 
                icon={<DiscountIcon />} 
                label="Desconto" 
                id="calculator-tab-3"
                aria-controls="calculator-tabpanel-3"
              />
              <Tab 
                icon={<InvestmentIcon />} 
                label="Investimento" 
                id="calculator-tab-4"
                aria-controls="calculator-tabpanel-4"
              />
            </Tabs>
          </Box>

          <Fade in={copyAlert}>
            <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
              Resultado copiado para a área de transferência!
            </Alert>
          </Fade>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ maxWidth: 320, mx: 'auto', p: 0.5, overflow: 'hidden' }}>
              {/* Display */}
              <Box 
                sx={{ 
                  mb: 0.5, 
                  p: 1,
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  minHeight: 70,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Current operation display */}
                {(previousValue !== null || operation) && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'grey.500',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: '0.875rem',
                      textAlign: 'right',
                      mb: 0.5,
                    }}
                  >
                    {previousValue !== null && `${previousValue} `}
                    {operation && `${operation === '*' ? '×' : operation === '/' ? '÷' : operation === '-' ? '−' : operation} `}
                    {waitingForNewValue && operation ? '' : display}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: 'grey.800',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontWeight: 300,
                      fontSize: display.length > 8 ? '1.75rem' : display.length > 6 ? '2.25rem' : '2.75rem',
                      textAlign: 'right',
                      wordBreak: 'break-all',
                      flex: 1,
                    }}
                  >
                    {display}
                  </Typography>
                  <Tooltip title="Copiar resultado">
                    <IconButton 
                      onClick={() => copyToClipboard(display)} 
                      size="small"
                      sx={{ 
                        ml: 1, 
                        color: 'grey.500',
                        '&:hover': { 
                          color: 'grey.700',
                          backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                        }
                      }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Calculator Buttons - Ultra Light Style */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
                {/* Row 1 */}
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('C')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.600',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  C
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('±')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.600',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  ±
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('%')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.600',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  %
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('/')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 500,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    '&:hover': { 
                      backgroundColor: 'primary.main',
                      boxShadow: 'none',
                    },
                  }}
                >
                  ÷
                </Button>

                {/* Row 2 */}
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('7')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  7
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('8')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  8
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('9')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  9
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('*')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 500,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    '&:hover': { 
                      backgroundColor: 'primary.main',
                      boxShadow: 'none',
                    },
                  }}
                >
                  ×
                </Button>

                {/* Row 3 */}
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('4')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  4
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('5')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  5
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('6')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  6
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('-')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 500,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    '&:hover': { 
                      backgroundColor: 'primary.main',
                      boxShadow: 'none',
                    },
                  }}
                >
                  −
                </Button>

                {/* Row 4 */}
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('1')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  1
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('2')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  2
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('3')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  3
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('+')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 500,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    '&:hover': { 
                      backgroundColor: 'primary.main',
                      boxShadow: 'none',
                    },
                  }}
                >
                  +
                </Button>

                {/* Row 5 */}
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('0')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    gridColumn: 'span 2',
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  0
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('.')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: '#ffffff',
                    color: 'grey.700',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 400,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: '#e8e8e8',
                    '&:hover': { 
                      backgroundColor: '#f9f9f9',
                      boxShadow: 'none',
                    },
                  }}
                >
                  ,
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleButtonClick('=')}
                  sx={{
                    height: 50,
                    fontSize: '0.95rem',
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderRadius: 1.5,
                    minWidth: 0,
                    fontWeight: 500,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    '&:hover': { 
                      backgroundColor: 'primary.main',
                      boxShadow: 'none',
                    },
                  }}
                >
                  =
                </Button>
              </Box>

              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 0.1, 
                  display: 'block', 
                  textAlign: 'center', 
                  color: 'text.disabled',
                  fontSize: '0.6rem',
                  fontStyle: 'italic',
                }}
              >
                Use os botões ou o teclado para calcular
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h6" sx={{ 
                mb: 1, 
                fontWeight: 500, 
                color: 'grey.800',
                fontSize: '1.1rem'
              }}>
                Cálculo de Porcentagem
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 3, 
                color: 'grey.600',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}>
                Preencha os valores abaixo para calcular a porcentagem
              </Typography>
              
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Valor Base"
                    type="number"
                    value={percentageBase}
                    onChange={(e) => setPercentageBase(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Ex: 1000 (valor total)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Porcentagem (%)"
                    type="number"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Ex: 15 (15% do valor base)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                </Stack>
                <Button 
                  variant="contained" 
                  onClick={calculatePercentage}
                  disabled={!percentageBase || !percentage}
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none',
                    },
                  }}
                >
                  Calcular Porcentagem
                </Button>
                {percentageResult && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e9ecef',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <Typography sx={{ color: 'grey.800', fontWeight: 500 }}>
                      Resultado: R$ {percentageResult}
                    </Typography>
                    <Tooltip title="Copiar resultado">
                      <IconButton 
                        onClick={() => copyToClipboard(percentageResult)} 
                        size="small"
                        sx={{ 
                          color: 'grey.600',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Stack>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h6" sx={{ 
                mb: 1, 
                fontWeight: 500, 
                color: 'grey.800',
                fontSize: '1.1rem'
              }}>
                Cálculo de Juros
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 3, 
                color: 'grey.600',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}>
                Preencha os valores para calcular juros simples e compostos
              </Typography>
              
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Capital (R$)"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Valor inicial investido"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Taxa (%)"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Taxa de juros por período"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                </Stack>
                <TextField
                  label="Tempo"
                  type="number"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Período de tempo"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#fcfcfc',
                      '& fieldset': {
                        borderColor: '#f0f0f0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#e0e0e0',
                      },
                    },
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={calculateInterest}
                  disabled={!principal || !rate || !time}
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none',
                    },
                  }}
                >
                  Calcular Juros
                </Button>
                {interestResult && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e9ecef',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <Typography sx={{ color: 'grey.800', fontWeight: 500, fontSize: '0.9rem' }}>
                      {interestResult}
                    </Typography>
                    <Tooltip title="Copiar resultado">
                      <IconButton 
                        onClick={() => copyToClipboard(interestResult)} 
                        size="small"
                        sx={{ 
                          color: 'grey.600',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Stack>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h6" sx={{ 
                mb: 1, 
                fontWeight: 500, 
                color: 'grey.800',
                fontSize: '1.1rem'
              }}>
                Cálculo de Desconto
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 3, 
                color: 'grey.600',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}>
                Calcule o valor do desconto e preço final
              </Typography>
              
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Preço Original (R$)"
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Preço antes do desconto"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Desconto (%)"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Porcentagem de desconto"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                </Stack>
                <Button 
                  variant="contained" 
                  onClick={calculateDiscount}
                  disabled={!originalPrice || !discountPercent}
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none',
                    },
                  }}
                >
                  Calcular Desconto
                </Button>
                {discountResult && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e9ecef',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <Typography sx={{ color: 'grey.800', fontWeight: 500, fontSize: '0.9rem' }}>
                      {discountResult}
                    </Typography>
                    <Tooltip title="Copiar resultado">
                      <IconButton 
                        onClick={() => copyToClipboard(discountResult)} 
                        size="small"
                        sx={{ 
                          color: 'grey.600',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Stack>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h6" sx={{ 
                mb: 1, 
                fontWeight: 500, 
                color: 'grey.800',
                fontSize: '1.1rem'
              }}>
                Cálculo de Investimento
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 3, 
                color: 'grey.600',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}>
                Simule o crescimento do seu investimento
              </Typography>
              
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Valor Inicial (R$)"
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Quantia a ser investida"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Taxa de Retorno (%)"
                    type="number"
                    value={investmentRate}
                    onChange={(e) => setInvestmentRate(e.target.value)}
                    fullWidth
                    size="small"
                    helperText="Retorno esperado por período"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#fcfcfc',
                        '& fieldset': {
                          borderColor: '#f0f0f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      },
                    }}
                  />
                </Stack>
                <TextField
                  label="Período"
                  type="number"
                  value={investmentTime}
                  onChange={(e) => setInvestmentTime(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Tempo do investimento"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#fcfcfc',
                      '& fieldset': {
                        borderColor: '#f0f0f0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#e0e0e0',
                      },
                    },
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={calculateInvestment}
                  disabled={!investmentAmount || !investmentRate || !investmentTime}
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none',
                    },
                  }}
                >
                  Calcular Investimento
                </Button>
                {investmentResult && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    border: '1px solid #e9ecef',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <Typography sx={{ color: 'grey.800', fontWeight: 500, fontSize: '0.9rem' }}>
                      {investmentResult}
                    </Typography>
                    <Tooltip title="Copiar resultado">
                      <IconButton 
                        onClick={() => copyToClipboard(investmentResult)} 
                        size="small"
                        sx={{ 
                          color: 'grey.600',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Stack>
            </Box>
          </TabPanel>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorModal;
