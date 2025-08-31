import { useState } from 'react';
import { Paper, Typography, Tabs, Tab, Box } from '@mui/material';
import { UsersManagement } from '../components/UsersManagement';
import { SavingsGoalSettings } from '../components/SavingsGoalSettings';
import { ModernHeader } from '../components/modern/ModernComponents';
import { colors } from '../theme/modernTheme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
        {/* Modern Header */}
        <ModernHeader
          title="Configurações"
          subtitle="Gerencie categorias, contatos, contas e configurações do sistema"
          breadcrumbs={[
            { label: 'TrackeOne Finance' },
            { label: 'Configurações' }
          ]}
        />

        <Paper sx={{ 
          borderRadius: 2,
          border: `1px solid ${colors.gray[200]}`,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'hidden'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            sx={{
              borderBottom: `1px solid ${colors.gray[200]}`,
              '& .MuiTab-root': {
                color: colors.gray[600],
                fontWeight: 500,
                '&.Mui-selected': {
                  color: colors.primary[600],
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: colors.primary[600]
              }
            }}
          >
            <Tab label="Usuários" />
            <Tab label="Meta de Economia" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <UsersManagement />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <SavingsGoalSettings />
          </TabPanel>
        </Paper>
      </Box>
    </Box>
  );
}