import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Chip,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  ShowChart as InvestmentIcon,
} from '@mui/icons-material';
import { colors } from '../../theme/modernTheme';

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

interface TransactionsTableProps {
  transactions: Transaction[];
  selectedTransactions: number[];
  handleSelectTransaction: (transactionId: number) => void;
  handleSelectAllTransactions: () => void;
  handleActionMenuOpen: (event: React.MouseEvent<HTMLElement>, transactionId: number) => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  orderBy: string;
  order: 'asc' | 'desc';
  handleSort: (property: string) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  selectedTransactions,
  handleSelectTransaction,
  handleSelectAllTransactions,
  handleActionMenuOpen,
  formatCurrency,
  formatDate,
  orderBy,
  order,
  handleSort
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Receita': return colors.success[600];
      case 'Despesa': return colors.error[600];
      case 'Investimento': return colors.primary[600];
      default: return colors.gray[600];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Receita': return <IncomeIcon sx={{ fontSize: 16 }} />;
      case 'Despesa': return <ExpenseIcon sx={{ fontSize: 16 }} />;
      case 'Investimento': return <InvestmentIcon sx={{ fontSize: 16 }} />;
      default: return null;
    }
  };

  if (isSmallScreen) {
    // Versão mobile
    return (
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        {transactions.map((transaction) => (
          <Box 
            key={transaction.id} 
            sx={{ 
              p: 2, 
              mb: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              bgcolor: selectedTransactions.includes(transaction.id) ? 'rgba(25, 118, 210, 0.08)' : 'white'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={selectedTransactions.includes(transaction.id)}
                  onChange={() => handleSelectTransaction(transaction.id)}
                  size="small"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ color: getTypeColor(transaction.transaction_type) }}>
                    {getTypeIcon(transaction.transaction_type)}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {transaction.description}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                size="small" 
                onClick={(e) => handleActionMenuOpen(e, transaction.id)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                {formatDate(transaction.transaction_date)}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  color: transaction.transaction_type === 'Despesa' ? colors.error[600] : colors.success[600]
                }}
              >
                {transaction.transaction_type === 'Despesa' ? '-' : ''}
                {formatCurrency(transaction.amount)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {transaction.category && (
                <Chip 
                  label={transaction.category.name} 
                  size="small" 
                  variant="outlined" 
                />
              )}
              {transaction.subcategory && (
                <Chip 
                  label={transaction.subcategory.name} 
                  size="small" 
                  variant="outlined" 
                />
              )}
              {transaction.contact && (
                <Chip 
                  label={transaction.contact.name} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip 
                label={transaction.is_paid ? 'Pago' : 'Pendente'} 
                size="small" 
                color={transaction.is_paid ? 'success' : 'warning'} 
                variant="outlined"
              />
              {(transaction.is_recurring || transaction.is_installment) && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {transaction.is_recurring && (
                    <Chip label="Recorrente" size="small" color="info" variant="outlined" />
                  )}
                  {transaction.is_installment && (
                    <Chip 
                      label={`Parcela ${transaction.installment_number}/${transaction.total_installments}`} 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Versão desktop
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                onChange={handleSelectAllTransactions}
                indeterminate={selectedTransactions.length > 0 && selectedTransactions.length < transactions.length}
              />
            </TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Contato</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.id} 
              sx={{ 
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                bgcolor: selectedTransactions.includes(transaction.id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedTransactions.includes(transaction.id)}
                  onChange={() => handleSelectTransaction(transaction.id)}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: getTypeColor(transaction.transaction_type) }}>
                    {getTypeIcon(transaction.transaction_type)}
                  </Box>
                  <Typography variant="body2">
                    {transaction.description}
                    {(transaction.is_recurring || transaction.is_installment) && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {transaction.is_recurring && (
                          <Chip label="Recorrente" size="small" color="info" variant="outlined" />
                        )}
                        {transaction.is_installment && (
                          <Chip 
                            label={`Parcela ${transaction.installment_number}/${transaction.total_installments}`} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                    )}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(transaction.transaction_date)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {transaction.category && (
                    <Chip 
                      label={transaction.category.name} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  {transaction.subcategory && (
                    <Chip 
                      label={transaction.subcategory.name} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {transaction.contact && (
                  <Chip 
                    label={transaction.contact.name} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: transaction.transaction_type === 'Despesa' ? colors.error[600] : colors.success[600]
                  }}
                >
                  {transaction.transaction_type === 'Despesa' ? '-' : ''}
                  {formatCurrency(transaction.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={transaction.is_paid ? 'Pago' : 'Pendente'} 
                  size="small" 
                  color={transaction.is_paid ? 'success' : 'warning'} 
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <IconButton 
                  size="small" 
                  onClick={(e) => handleActionMenuOpen(e, transaction.id)}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};