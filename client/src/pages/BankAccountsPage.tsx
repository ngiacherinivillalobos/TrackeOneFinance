import React from 'react';
import { Box } from '@mui/material';
import { colors } from '../theme/modernTheme';
import { ModernHeader } from '../components/modern/ModernComponents';
import BankAccounts from './BankAccounts';

export default function BankAccountsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
        {/* Modern Header */}
        <ModernHeader
          title="Contas Bancárias"
          subtitle="Gerencie suas contas bancárias"
          breadcrumbs={[
            { label: 'TrackeOne Finance' },
            { label: 'Cadastros' },
            { label: 'Contas Bancárias' }
          ]}
        />
        
        <Box sx={{ 
          bgcolor: '#FFFFFF', 
          borderRadius: 2,
          border: `1px solid ${colors.gray[200]}`,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          p: 3
        }}>
          <BankAccounts />
        </Box>
      </Box>
    </Box>
  );
}