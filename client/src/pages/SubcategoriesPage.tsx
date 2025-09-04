import React, { useEffect, useState } from 'react';
import { BaseCRUDPage } from '../components/shared/BaseCRUDPage';
import { useCRUD } from '../hooks/useCRUD';
import { subcategoryService, Subcategory } from '../services/subcategoryService';
import { categoryService, Category } from '../services/categoryService';

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

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadData();
    
    // Carregar categorias para o formulário
    const loadCategories = async () => {
      try {
        console.log('Carregando categorias para o formulário de subcategorias...');
        const categoriesData = await categoryService.list();
        console.log('Categorias carregadas:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    
    loadCategories();
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

  // Função para obter o nome da categoria pelo ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  // Definir colunas para a tabela
  const columns = [
    { key: 'name', title: 'Nome' },
    { 
      key: 'category_id', 
      title: 'Categoria',
      render: (item: Subcategory) => getCategoryName(item.category_id)
    },
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
      options: categories.map(category => ({
        value: category.id,
        label: `${category.name} (${category.source_type})`
      }))
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