import { useState, useCallback } from 'react';

interface UseCRUDOptions<T> {
  list: () => Promise<T[]>;
  create: (data: Omit<T, 'id'>) => Promise<T>;
  update: (id: number, data: Omit<T, 'id'>) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

export function useCRUD<T extends { id?: number }>({ list, create, update, delete: deleteItem }: UseCRUDOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await list();
      setData(result);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err?.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [list]);

  const createItem = useCallback(async (item: Omit<T, 'id'>) => {
    try {
      const newItem = await create(item);
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (err: any) {
      console.error('Erro ao criar item:', err);
      throw new Error(err?.response?.data?.error || 'Erro ao criar item');
    }
  }, [create]);

  const updateItem = useCallback(async (id: number, item: Omit<T, 'id'>) => {
    try {
      const updatedItem = await update(id, item);
      setData(prev => prev.map(i => i.id === id ? updatedItem : i));
      return updatedItem;
    } catch (err: any) {
      console.error('Erro ao atualizar item:', err);
      throw new Error(err?.response?.data?.error || 'Erro ao atualizar item');
    }
  }, [update]);

  const deleteItemById = useCallback(async (id: number) => {
    try {
      await deleteItem(id);
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Erro ao excluir item:', err);
      throw new Error(err?.response?.data?.error || 'Erro ao excluir item');
    }
  }, [deleteItem]);

  return {
    data,
    loading,
    error,
    loadData,
    createItem,
    updateItem,
    deleteItemById,
  };
}