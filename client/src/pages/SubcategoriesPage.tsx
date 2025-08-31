import React, { useEffect } from 'react';
import { BaseCRUDPage } from '../components/shared/BaseCRUDPage';
import { useCRUD } from '../hooks/useCRUD';
import { subcategoryService, Subcategory } from '../services/subcategoryService';

export default function SubcategoriesPage() {
  const {
    data: subcategories,
    loading,
    error,
    loadData,
    createItem: createItemHook,
    updateItem: updateItemHook,
    deleteItemById,
  } = useCRUD<Subcategory>({
    list: subcategoryService.list,
    create: subcategoryService.create,
    update: subcategoryService.update,
    delete: subcategoryService.delete,
  });

  useEffect(() => {
    loadData();
  }, []);

  const createItem = async (item: Omit<Subcategory, 'id'>): Promise<void> => {
    try {
      await subcategoryService.create(item);
      loadData();
    } catch (error) {
      console.error('Erro ao criar subcategoria:', error);
      throw error;
    }
  };

  const updateItem = async (id: number, item: Omit<Subcategory, 'id'>): Promise<void> => {
    try {
      await subcategoryService.update(id, item);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar subcategoria:', error);
      throw error;
    }
  };

  // Definir colunas para a tabela
  const columns = [
    { key: 'name', title: 'Nome' },
    { key: 'category_name', title: 'Categoria' },
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
      name: 'category_id', 
      label: 'Categoria', 
      type: 'select' as const, 
      required: true,
      options: [] // Será preenchido dinamicamente
    }
  ];

  return (
    <BaseCRUDPage<Subcategory>
      title="Subcategorias"
      columns={columns}
      fields={fields}
      data={subcategories}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItemById}
      emptyMessage="Nenhuma subcategoria encontrada"
    />
  );
}