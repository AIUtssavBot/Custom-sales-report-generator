import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  TableChart as TableChartIcon,
  Analytics as AnalyticsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { useTheme } from '../../contexts/ThemeContext';
import ChartConfig, { ChartConfig as ChartConfigType } from './ChartConfig';
import DynamicChart from './DynamicChart';
import PaginatedDataTable from './PaginatedDataTable';

const Dashboard: React.FC = () => {
  const datasetInfo = useSelector((state: RootState) => state.data.datasetInfo);
  const { darkMode, toggleDarkMode } = useTheme();
  const [charts, setCharts] = useState<ChartConfigType[]>([]);
  const [showChartConfig, setShowChartConfig] = useState(false);
  const [editingChart, setEditingChart] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

  if (!datasetInfo) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>No Dataset Loaded</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Please upload a dataset first to view the dashboard.
        </Typography>
      </Box>
    );
  }

  const sampleData = datasetInfo.data || [];

  const handleAddChart = (config: ChartConfigType) => {
    if (editingChart) {
      setCharts(charts.map(chart => 
        chart.id === editingChart ? config : chart
      ));
      setEditingChart(null);
    } else {
      setCharts([...charts, config]);
    }
    setShowChartConfig(false);
  };

  const handleDeleteChart = (id: string) => {
    setCharts(charts.filter(chart => chart.id !== id));
  };

  const handleEditChart = (id: string) => {
    setEditingChart(id);
    setShowChartConfig(true);
  };

  const speedDialActions = [
    {
      icon: <AddIcon />,
      name: 'Add Chart',
      action: () => setShowChartConfig(true)
    },
    {
      icon: darkMode ? <LightModeIcon /> : <DarkModeIcon />,
      name: darkMode ? 'Light Mode' : 'Dark Mode',
      action: toggleDarkMode
    },
    {
      icon: <TableChartIcon />,
      name: 'Data Table',
      action: () => setViewMode(viewMode === 'charts' ? 'table' : 'charts')
    }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Dynamic Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {datasetInfo.fileName} • {datasetInfo.rowCount.toLocaleString()} rows • {datasetInfo.columnCount} columns
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            label={`${((1 - datasetInfo.dataQuality.missingValues / (datasetInfo.rowCount * datasetInfo.columnCount)) * 100).toFixed(1)}% Quality`} 
            color="success" 
            variant="outlined"
          />
          <Button
            variant="outlined"
            startIcon={darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            onClick={toggleDarkMode}
          >
            {darkMode ? 'Light' : 'Dark'} Mode
          </Button>
        </Box>
      </Box>

      {/* Dataset Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>File Name</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{datasetInfo.fileName}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Total Rows</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{datasetInfo.rowCount.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Columns</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{datasetInfo.columnCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Missing Values</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {datasetInfo.dataQuality.missingValues.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Mode Toggle */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button
          variant={viewMode === 'charts' ? 'contained' : 'outlined'}
          startIcon={<AnalyticsIcon />}
          onClick={() => setViewMode('charts')}
        >
          Charts View
        </Button>
        <Button
          variant={viewMode === 'table' ? 'contained' : 'outlined'}
          startIcon={<TableChartIcon />}
          onClick={() => setViewMode('table')}
        >
          Data Table
        </Button>
      </Box>

      {/* Charts View */}
      {viewMode === 'charts' && (
        <Grid container spacing={3}>
          {charts.length === 0 ? (
            <Grid item xs={12}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 6, 
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>No Charts Created Yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Click the + button to create your first chart
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowChartConfig(true)}
                >
                  Create Chart
                </Button>
              </Paper>
            </Grid>
          ) : (
            charts.map((chart) => (
              <Grid item xs={12} md={6} lg={4} key={chart.id}>
                <DynamicChart
                  config={chart}
                  data={sampleData}
                  onDelete={handleDeleteChart}
                  onEdit={handleEditChart}
                />
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Data Table View */}
      {viewMode === 'table' && (
        <PaginatedDataTable
          data={sampleData}
          columns={datasetInfo.columns}
          title="Complete Dataset"
        />
      )}

      {/* Chart Configuration Dialog */}
      <Dialog 
        open={showChartConfig} 
        onClose={() => {
          setShowChartConfig(false);
          setEditingChart(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <ChartConfig
            columns={datasetInfo.columns}
            onAddChart={handleAddChart}
            onClose={() => {
              setShowChartConfig(false);
              setEditingChart(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel="Dashboard Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default Dashboard;