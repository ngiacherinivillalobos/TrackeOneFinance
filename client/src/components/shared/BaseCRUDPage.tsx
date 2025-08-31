import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { BaseTable } from './BaseTable';
import { BaseForm } from './BaseForm';

interface BaseCRUDPageProps<T> {
  title: string;
  columns: any[];
  fields: any[];
  data: T[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreate?: (data: Omit<T, 'id'>) => Promise<void>;
  onUpdate?: (id: number, data: Omit<T, 'id'>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  emptyMessage?: string;
}

export function BaseCRUDPage<T extends { id?: number }>({
  title,
  columns,
  fields,
  data,
  loading,
  error,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  emptyMessage = 'Nenhum registro encontrado',
}: BaseCRUDPageProps<T>) {
  const [openForm, setOpenForm] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Resetar formulário quando abrir/fechar
  useEffect(() => {
    if (!openForm) {
      setEditingItem(null);
      setFormValues({});
      setFormError(null);
    } else if (editingItem) {
      // Preencher formulário com dados do item em edição
      const initialValues: Record<string, any> = {};
      fields.forEach(field => {
        initialValues[field.name] = (editingItem as any)[field.name] || '';
      });
      setFormValues(initialValues);
    } else {
      // Valores padrão para novo item
      const initialValues: Record<string, any> = {};
      fields.forEach(field => {
        initialValues[field.name] = field.defaultValue || '';
      });
      setFormValues(initialValues);
    }
  }, [openForm, editingItem, fields]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setOpenForm(true);
  };

  const handleOpenEdit = (item: T) => {
    setEditingItem(item);
    setOpenForm(true);
  };

  const handleDelete = async (item: T) => {
    if (!onDelete || !item.id) return;
    
    if (window.confirm(`Tem certeza que deseja excluir este(a) ${title.toLowerCase()}?`)) {
      try {
        await onDelete(item.id);
        onRefresh();
      } catch (error) {
        console.error(`Erro ao excluir ${title.toLowerCase()}:`, error);
        alert(`Erro ao excluir ${title.toLowerCase()}`);
      }
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    if (!formValues) return;
    
    setFormLoading(true);
    setFormError(null);
    
    try {
      if (editingItem && onUpdate && editingItem.id) {
        // Atualizar item existente
        await onUpdate(editingItem.id, formValues as Omit<T, 'id'>);
      } else if (onCreate) {
        // Criar novo item
        await onCreate(formValues as Omit<T, 'id'>);
      }
      
      // Fechar formulário e atualizar dados
      setOpenForm(false);
      onRefresh();
    } catch (error: any) {
      console.error(`Erro ao salvar ${title.toLowerCase()}:`, error);
      setFormError(error?.response?.data?.error || `Erro ao salvar ${title.toLowerCase()}`);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          disabled={!onCreate}
        >
          Novo
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <BaseTable
        data={data}
        columns={columns}
        onEdit={onUpdate ? handleOpenEdit : undefined}
        onDelete={onDelete ? handleDelete : undefined}
        loading={loading}
        emptyMessage={emptyMessage}
      />

      {openForm && (
        <BaseForm
          title={title}
          fields={fields}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenForm(false)}
          isEditing={!!editingItem}
          loading={formLoading}
          error={formError}
        />
      )}

      <Fab
        color="primary"
        aria-label="adicionar"
        onClick={handleOpenCreate}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}