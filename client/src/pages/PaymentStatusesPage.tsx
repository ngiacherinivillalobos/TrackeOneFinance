import React from 'react';
import { Box } from '@mui/material';
import { colors } from '../theme/modernTheme';
import { ModernHeader } from '../components/modern/ModernComponents';
import PaymentStatuses from './PaymentStatuses';

export default function PaymentStatusesPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
        {/* Modern Header */}
        <ModernHeader
          title="Status de Pagamento"
          subtitle="Gerencie os status de pagamento do sistema"
          breadcrumbs={[
            { label: 'TrackeOne Finance' },
            { label: 'Cadastros' },
            { label: 'Status de Pagamento' }
          ]}
        />
        
        <Box sx={{ 
          bgcolor: '#FFFFFF', 
          borderRadius: 2,
          border: `1px solid ${colors.gray[200]}`,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          p: 3
        }}>
          <PaymentStatuses />
        </Box>
      </Box>
    </Box>
  );
}