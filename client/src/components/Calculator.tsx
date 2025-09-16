import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
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

interface CalculatorProps {
  onClose?: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
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
    const months = parseFloat(investmentTime) * 12;
    
    if (!isNaN(monthly) && !isNaN(annualRate) && !isNaN(months)) {
      const monthlyRate = annualRate / 12;
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

  const handleButtonClick = (btn: string) => {
    if (btn === 'C') {
      clear();
    } else if (btn === '=') {
      calculate();
    } else if (['+', '-', '*', '/'].includes(btn)) {
      performOperation(btn);
    } else if (btn === '.') {
      inputDecimal();
    } else if (btn === '±') {
      setDisplay(String(parseFloat(display) * -1));
    } else if (btn === '%') {
      setDisplay(String(parseFloat(display) / 100));
    } else {
      inputNumber(btn);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalculateIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            Calculadora Financeira
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        {copyMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {copyMessage}
          </Alert>
        )}

        {/* Basic Calculator */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Calculadora Básica
          </Typography>
          
          <TextField
            fullWidth
            value={display}
            variant="outlined"
            sx={{ 
              mb: 2,
              '& .MuiInputBase-input': {
                textAlign: 'right',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }
            }}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title="Copiar valor">
                  <IconButton onClick={() => copyToClipboard(display)}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              )
            }}
          />

          {/* Calculator Buttons */}
          <Stack spacing={1}>
            {/* Row 1 */}
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="outlined" color="error" sx={{ height: 60 }} onClick={() => handleButtonClick('C')}>C</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('±')}>±</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('%')}>%</Button>
              <Button fullWidth variant="contained" sx={{ height: 60 }} onClick={() => handleButtonClick('/')}>÷</Button>
            </Stack>
            
            {/* Row 2 */}
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('7')}>7</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('8')}>8</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('9')}>9</Button>
              <Button fullWidth variant="contained" sx={{ height: 60 }} onClick={() => handleButtonClick('*')}>×</Button>
            </Stack>
            
            {/* Row 3 */}
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('4')}>4</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('5')}>5</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('6')}>6</Button>
              <Button fullWidth variant="contained" sx={{ height: 60 }} onClick={() => handleButtonClick('-')}>−</Button>
            </Stack>
            
            {/* Row 4 */}
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('1')}>1</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('2')}>2</Button>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('3')}>3</Button>
              <Button fullWidth variant="contained" sx={{ height: 60 }} onClick={() => handleButtonClick('+')}>+</Button>
            </Stack>
            
            {/* Row 5 */}
            <Stack direction="row" spacing={1}>
              <Box sx={{ flex: 2, mr: 1 }}>
                <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('0')}>0</Button>
              </Box>
              <Button fullWidth variant="outlined" sx={{ height: 60 }} onClick={() => handleButtonClick('.')}>.</Button>
              <Button fullWidth variant="contained" color="primary" sx={{ height: 60 }} onClick={() => handleButtonClick('=')}>=</Button>
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Financial Calculators */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PercentIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Calculadora de Porcentagem</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Porcentagem (%)"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  type="number"
                />
                <TextField
                  fullWidth
                  label="Valor Base (R$)"
                  value={percentageBase}
                  onChange={(e) => setPercentageBase(e.target.value)}
                  type="number"
                />
                <Button
                  variant="contained"
                  onClick={calculatePercentage}
                  sx={{ minWidth: 120, height: 56 }}
                >
                  Calcular
                </Button>
              </Stack>
              {percentageResult && (
                <TextField
                  fullWidth
                  label="Resultado"
                  value={`R$ ${percentageResult}`}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title="Copiar resultado">
                        <IconButton onClick={() => copyToClipboard(percentageResult)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BankIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Calculadora de Juros</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Capital Inicial (R$)"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  type="number"
                />
                <TextField
                  fullWidth
                  label="Taxa de Juros (%)"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  type="number"
                />
                <TextField
                  fullWidth
                  label="Tempo (anos)"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  type="number"
                />
              </Stack>
              <Button
                variant="contained"
                onClick={calculateInterest}
                fullWidth
              >
                Calcular Juros
              </Button>
              {interestResult && (
                <TextField
                  fullWidth
                  label="Resultado"
                  value={interestResult}
                  multiline
                  rows={2}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title="Copiar resultado">
                        <IconButton onClick={() => copyToClipboard(interestResult)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DiscountIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Calculadora de Desconto</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Preço Original (R$)"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  type="number"
                />
                <TextField
                  fullWidth
                  label="Desconto (%)"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  type="number"
                />
                <Button
                  variant="contained"
                  onClick={calculateDiscount}
                  sx={{ minWidth: 120, height: 56 }}
                >
                  Calcular
                </Button>
              </Stack>
              {discountResult && (
                <TextField
                  fullWidth
                  label="Resultado"
                  value={discountResult}
                  multiline
                  rows={2}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title="Copiar resultado">
                        <IconButton onClick={() => copyToClipboard(discountResult)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InvestmentIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Simulador de Investimento</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Valor Mensal (R$)"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(e.target.value)}
                  type="number"
                />
                <TextField
                  fullWidth
                  label="Taxa Anual (%)"
                  value={investmentRate}
                  onChange={(e) => setInvestmentRate(e.target.value)}
                  type="number"
                />
                <TextField
                  fullWidth
                  label="Período (anos)"
                  value={investmentTime}
                  onChange={(e) => setInvestmentTime(e.target.value)}
                  type="number"
                />
              </Stack>
              <Button
                variant="contained"
                onClick={calculateInvestment}
                fullWidth
              >
                Simular Investimento
              </Button>
              {investmentResult && (
                <TextField
                  fullWidth
                  label="Resultado da Simulação"
                  value={investmentResult}
                  multiline
                  rows={2}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title="Copiar resultado">
                        <IconButton onClick={() => copyToClipboard(investmentResult)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
};

export default Calculator;