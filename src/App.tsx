import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Paper, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { Provider } from 'react-redux';
import { store } from './store';
import { CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import FileUpload from './components/FileUpload';
import Analysis from './components/Analysis';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'upload' | 'analysis' | 'dashboard'>('upload');
  const { darkMode, toggleDarkMode } = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'upload' | 'analysis' | 'dashboard') => {
    setCurrentView(newValue);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return <FileUpload onFileProcessed={() => setCurrentView('analysis')} />;
      case 'analysis':
        return <Analysis onCreateDashboard={() => setCurrentView('dashboard')} />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <FileUpload onFileProcessed={() => setCurrentView('analysis')} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Business Analytics Dashboard
          </Typography>
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tabs 
              value={currentView} 
              onChange={handleTabChange}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab value="upload" label="Upload Data" />
              <Tab value="analysis" label="Analysis" />
              <Tab value="dashboard" label="Dashboard" />
            </Tabs>
            <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={toggleDarkMode} color="inherit">
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {renderContent()}
      </Box>
      <Box component="footer" sx={{ py: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Business Analytics Dashboard © {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <Provider store={store}>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </Provider>
  );
}

export default App;
