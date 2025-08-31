import React, { useEffect } from 'react';
import { BaseCRUDPage } from '../components/shared/BaseCRUDPage';
import { useCRUD } from '../hooks/useCRUD';
import { categoryTypeService, CategoryType } from '../services/categoryTypeService';

export default function CategoryTypesPage() {
  const {
    data: categoryTypes,
    loading,
    error,
    loadData,
    createItem: createItemHook,
    updateItem: updateItemHook,
    deleteItemById,
  } = useCRUD<CategoryType>({
    list: categoryTypeService.list,
    create: categoryTypeService.create,
    update: categoryTypeService.update,
    delete: categoryTypeService.delete,
  });

  useEffect(() => {
    loadData();
  }, []);

  const createItem = async (item: Omit<CategoryType, 'id'>): Promise<void> => {
    try {
      await categoryTypeService.create(item);
      loadData();
    } catch (error) {
      console.error('Erro ao criar tipo de categoria:', error);
      throw error;
    }
  };

  const updateItem = async (id: number, item: Omit<CategoryType, 'id'>): Promise<void> => {
    try {
      await categoryTypeService.update(id, item);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar tipo de categoria:', error);
      throw error;
    }
  };

  // Definir colunas para a tabela
  const columns = [
    { key: 'name', title: 'Nome' },
    { key: 'description', title: 'Descrição' },
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
      name: 'description', 
      label: 'Descrição', 
      type: 'text' as const 
    }
  ];

  return (
    <BaseCRUDPage<CategoryType>
      title="Tipos de Categoria"
      columns={columns}
      fields={fields}
      data={categoryTypes}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItemById}
      emptyMessage="Nenhum tipo de categoria encontrado"
    />
  );
}