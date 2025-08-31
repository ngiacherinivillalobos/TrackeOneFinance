import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface BaseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
}

export function BaseTable<T extends { id?: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  showActions = true,
}: BaseTableProps<T>) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="body1" color="textSecondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align || 'left'}>
                {column.title}
              </TableCell>
            ))}
            {showActions && (onEdit || onDelete) && (
              <TableCell align="right">Ações</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={item.id || index}>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || 'left'}>
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </TableCell>
              ))}
              {showActions && (onEdit || onDelete) && (
                <TableCell align="right">
                  {onEdit && (
                    <IconButton onClick={() => onEdit(item)}>
                      <EditIcon />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton onClick={() => onDelete(item)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}