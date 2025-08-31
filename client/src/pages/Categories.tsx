import React from 'react';
import { Categories as CategoriesComponent } from '../components/Categories';
import { PageLayout } from '../components/layout/PageLayout';

const Categories: React.FC = () => {
  return (
    <PageLayout
      title="Categorias"
      subtitle="Gerencie as categorias de transações"
    >
      <CategoriesComponent />
    </PageLayout>
  );
};

export default Categories;