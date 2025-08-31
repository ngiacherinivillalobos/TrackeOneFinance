import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { BaseTable } from './shared/BaseTable';
import { BaseForm } from './shared/BaseForm';
import { Category, categoryService } from '../services/categoryService';
import { CategoryType, categoryTypeService } from '../services/categoryTypeService';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    source_type: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, typesData] = await Promise.all([
        categoryService.list(),
        categoryTypeService.list()
      ]);
      setCategories(categoriesData);
      setCategoryTypes(typesData);
      
      // Definir tipo padrão se houver
      if (typesData.length > 0 && !formData.source_type) {
        setFormData(prev => ({ ...prev, source_type: typesData[0].name }));
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err?.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingCategory(null);
    setFormData({ name: '', source_type: categoryTypes[0]?.name || '' });
    setFormError(null);
  };

  useEffect(() => {
    if (openForm && editingCategory) {
      setFormData({ 
        name: editingCategory.name, 
        source_type: editingCategory.source_type 
      });
    } else if (openForm && categoryTypes.length > 0) {
      setFormData({ 
        name: '', 
        source_type: categoryTypes[0].name 
      });
    }
  }, [openForm, editingCategory, categoryTypes]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setOpenForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!category.id) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await categoryService.delete(category.id);
        await loadData();
      } catch (err: any) {
        console.error('Error deleting category:', err);
        alert(err?.response?.data?.error || 'Erro ao excluir categoria');
      }
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError('Nome é obrigatório');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const categoryData = {
        name: formData.name.trim(),
        source_type: formData.source_type
      };

      if (editingCategory) {
        await categoryService.update(editingCategory.id!, categoryData);
      } else {
        await categoryService.create(categoryData);
      }

      handleCloseForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      setFormError('Erro ao salvar categoria. Por favor, tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // Definir colunas para a tabela
  const columns = [
    { key: 'name', title: 'Nome' },
    { key: 'source_type', title: 'Tipo' },
  ];

  // Definir campos para o formulário
  const fields = [
    { 
      name: 'name', 
      label: 'Nome', 
      type: 'text' as const, 
      required: true 
    },
    { 
      name: 'source_type', 
      label: 'Tipo', 
      type: 'select' as const, 
      required: true,
      options: categoryTypes.map(type => ({
        value: type.name,
        label: type.name
      }))
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <h1>Categorias</h1>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleOpenCreate}
        >
          Nova Categoria
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <div style={{ color: 'red' }}>{error}</div>
        </Box>
      )}

      <BaseTable
        data={categories}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Nenhuma categoria encontrada"
      />

      {openForm && (
        <BaseForm
          title="Categoria"
          fields={fields}
          values={formData}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isEditing={!!editingCategory}
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

