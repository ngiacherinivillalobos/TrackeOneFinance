import React, { useEffect } from 'react';
import { BaseCRUDPage } from '../components/shared/BaseCRUDPage';
import { useCRUD } from '../hooks/useCRUD';
import { costCenterService, CostCenter } from '../services/costCenterService';

export default function CostCentersPage() {
  const {
    data: costCenters,
    loading,
    error,
    loadData,
    createItem: createItemHook,
    updateItem: updateItemHook,
    deleteItemById,
  } = useCRUD<CostCenter>({
    list: costCenterService.list,
    create: costCenterService.create,
    update: costCenterService.update,
    delete: costCenterService.delete,
  });

  useEffect(() => {
    loadData();
  }, []);

  const createItem = async (item: Omit<CostCenter, 'id'>): Promise<void> => {
    try {
      await costCenterService.create(item);
      loadData();
    } catch (error) {
      console.error('Erro ao criar centro de custo:', error);
      throw error;
    }
  };

  const updateItem = async (id: number, item: Omit<CostCenter, 'id'>): Promise<void> => {
    try {
      await costCenterService.update(id, item);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar centro de custo:', error);
      throw error;
    }
  };

  // Definir colunas para a tabela
  const columns = [
    { key: 'name', title: 'Nome' },
    { key: 'number', title: 'Número' },
    { 
      key: 'payment_days', 
      title: 'Dias de Recebimento',
      render: (value: string) => value ? `Dias: ${value}` : '-'
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
      name: 'number', 
      label: 'Número', 
      type: 'text' as const 
    },
    { 
      name: 'payment_days', 
      label: 'Dias de Recebimento', 
      type: 'text' as const,
      placeholder: 'Ex: 5,15,20 (separados por vírgula)',
      helperText: 'Informe os dias do mês de recebimento separados por vírgula'
    }
  ];

  return (
    <BaseCRUDPage<CostCenter>
      title="Centros de Custo"
      columns={columns}
      fields={fields}
      data={costCenters}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItemById}
      emptyMessage="Nenhum centro de custo encontrado"
    />
  );
}