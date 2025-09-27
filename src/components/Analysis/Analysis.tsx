import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import LinkIcon from '@mui/icons-material/Link';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { RootState } from '../../store';
import { setCurrentView } from '../../store/uiSlice';
import { detectTimeTrends, findCorrelations, identifyOutliers } from '../../services/aiAnalysis';
import { TimeTrend, Correlation, OutlierInfo, Recommendation, Insights } from '../../types';

interface AnalysisProps {
  onCreateDashboard?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface InsightsPanelProps {
  data: any[];
  columns: any[];
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const InsightsPanel: React.FC<InsightsPanelProps> = ({ data, columns }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAIInsights = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert columns array to record for the AI functions
      const columnsRecord: Record<string, any> = {};
      columns.forEach(col => {
        columnsRecord[col.name] = col;
      });
      
      // Find date and numeric columns for time trends
      const dateColumns = columns.filter(col => col.type === 'datetime').map(col => col.name);
      const numericColumns = columns.filter(col => col.type === 'numeric').map(col => col.name);
      
      // Generate time trends if we have date and numeric columns
      let timeTrends: TimeTrend[] = [];
      if (dateColumns.length > 0 && numericColumns.length > 0) {
        dateColumns.forEach(dateCol => {
          numericColumns.forEach(numCol => {
            const trend = detectTimeTrends(data, dateCol, numCol);
            if (trend) {
              timeTrends.push({
                dateColumn: dateCol,
                valueColumn: numCol,
                ...trend
              });
            }
          });
        });
      }
      
      // Find correlations between columns
      const correlations = findCorrelations(data, columnsRecord);
      
      // Identify outliers
      const outliers = identifyOutliers(data, columnsRecord);
      
      // Generate recommendations based on findings
      const recommendations: Recommendation[] = [];
      
      if (timeTrends.length > 0) {
        recommendations.push({
          type: 'trend',
          message: `Consider creating time series visualizations for ${timeTrends[0].dateColumn} and ${timeTrends[0].valueColumn}`
        });
      }
      
      if (correlations.length > 0) {
        recommendations.push({
          type: 'correlation',
          message: `Explore the relationship between ${correlations[0].columns[0]} and ${correlations[0].columns[1]}`
        });
      }
      
      if (Object.keys(outliers).length > 0) {
        const outlierColumn = Object.keys(outliers)[0];
        recommendations.push({
          type: 'outlier',
          message: `Investigate outliers in ${outlierColumn} (${outliers[outlierColumn].count} found)`
        });
      }
      
      // Add general insights based on data characteristics
      if (data.length > 1000) {
        recommendations.push({
          type: 'data_volume',
          message: `Large dataset detected (${data.length.toLocaleString()} rows). Consider using sampling for initial analysis.`
        });
      }
      
      if (numericColumns.length === 0) {
        recommendations.push({
          type: 'data_type',
          message: 'No numeric columns found. Consider converting text data to numeric for statistical analysis.'
        });
      }
      
      if (dateColumns.length === 0) {
        recommendations.push({
          type: 'data_type',
          message: 'No date columns found. Time series analysis requires date/time data.'
        });
      }
      
      // Set insights
      setInsights({
        timeTrends,
        correlations,
        outliers,
        recommendations
      });
      
    } catch (err) {
      setError('Error generating insights. Please try again.');
      console.error('AI Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {!insights && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>AI-Powered Insights</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Our AI engine will analyze your data to discover patterns, trends, and anomalies.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={generateAIInsights}
            startIcon={<LightbulbIcon />}
          >
            Generate Insights
          </Button>
        </Box>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>Analyzing your data...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This may take a moment as we process your dataset
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      )}
      
      {insights && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">AI Analysis Results</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setInsights(null)}
            >
              New Analysis
            </Button>
          </Box>
          
          {insights.recommendations.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                <List>
                  {insights.recommendations.map((rec: Recommendation, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LightbulbIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={rec.message} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
          
          {insights.timeTrends.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Time Trends
                </Typography>
                <Grid container spacing={2}>
                  {insights.timeTrends.map((trend: TimeTrend, index: number) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {trend.trendDirection === 'increasing' && <TrendingUpIcon color="success" />}
                          {trend.trendDirection === 'decreasing' && <TrendingDownIcon color="error" />}
                          {trend.trendDirection === 'stable' && <TrendingFlatIcon color="info" />}
                          <Typography variant="subtitle1" sx={{ ml: 1 }}>
                            {trend.dateColumn} vs {trend.valueColumn}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {trend.trendDirection.charAt(0).toUpperCase() + trend.trendDirection.slice(1)} trend 
                          ({trend.percentChange}% change)
                        </Typography>
                        {trend.seasonality && (
                          <Typography variant="body2" color="text.secondary">
                            Seasonal patterns detected
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
          
          {insights.correlations.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Correlations
                </Typography>
                <Grid container spacing={2}>
                  {insights.correlations.slice(0, 4).map((corr: Correlation, index: number) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LinkIcon color={corr.direction === 'positive' ? 'success' : 'error'} />
                          <Typography variant="subtitle1" sx={{ ml: 1 }}>
                            {corr.columns[0]} & {corr.columns[1]}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {corr.strength.charAt(0).toUpperCase() + corr.strength.slice(1)} {corr.direction} correlation
                          ({corr.correlation})
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
          
          {Object.keys(insights.outliers).length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Outliers Detected
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(insights.outliers).slice(0, 4).map(([column, info]: [string, OutlierInfo], index: number) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <WarningIcon color="warning" />
                          <Typography variant="subtitle1" sx={{ ml: 1 }}>
                            {column}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {info.count} outliers detected ({info.percentage}%)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Range: {info.boundaries.lower.toFixed(2)} to {info.boundaries.upper.toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

const Analysis: React.FC<AnalysisProps> = ({ onCreateDashboard }) => {
  const dispatch = useDispatch();
  const datasetInfo = useSelector((state: RootState) => state.data.datasetInfo);
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateDashboard = () => {
    if (onCreateDashboard) {
      onCreateDashboard();
    } else {
      dispatch(setCurrentView('dashboard'));
    }
  };

  if (!datasetInfo) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5">No dataset loaded</Typography>
        <Button 
          variant="contained" 
          onClick={() => dispatch(setCurrentView('upload'))}
          sx={{ mt: 2 }}
        >
          Upload Data
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dataset Analysis</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleCreateDashboard}
        >
          Create Dashboard
        </Button>
      </Box>

      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Dataset Overview</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">File Name</Typography>
                  <Typography variant="h6">{datasetInfo.fileName}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Rows</Typography>
                  <Typography variant="h6">{datasetInfo.rowCount.toLocaleString()}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Columns</Typography>
                  <Typography variant="h6">{datasetInfo.columnCount}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Data Quality</Typography>
                  <Typography variant="h6">
                    {((1 - datasetInfo.dataQuality.missingValues / (datasetInfo.rowCount * datasetInfo.columnCount)) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="analysis tabs">
            <Tab label="Data Quality" />
            <Tab label="Column Details" />
            <Tab label="Insights" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Missing Values</Typography>
                <Typography variant="h4">{datasetInfo.dataQuality.missingValues}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {((datasetInfo.dataQuality.missingValues / (datasetInfo.rowCount * datasetInfo.columnCount)) * 100).toFixed(2)}% of total cells
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Duplicate Rows</Typography>
                <Typography variant="h4">{datasetInfo.dataQuality.duplicateRows}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {((datasetInfo.dataQuality.duplicateRows / datasetInfo.rowCount) * 100).toFixed(2)}% of total rows
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Outliers</Typography>
                <Typography variant="h4">{datasetInfo.dataQuality.outliers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Detected in numeric columns
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Column Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Unique Values</TableCell>
                  <TableCell>Missing Values</TableCell>
                  <TableCell>Statistics</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datasetInfo.columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell>{column.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={column.type} 
                        color={
                          column.type === 'numeric' ? 'primary' :
                          column.type === 'categorical' ? 'secondary' :
                          column.type === 'datetime' ? 'success' :
                          column.type === 'boolean' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{column.uniqueValues}</TableCell>
                    <TableCell>
                      {column.missingValues} ({column.missingPercentage?.toFixed(2)}%)
                    </TableCell>
                    <TableCell>
                      {column.type === 'numeric' && (
                        <>
                          Min: {column.min}, Max: {column.max}, Mean: {(column.mean as number)?.toFixed(2)}
                        </>
                      )}
                      {column.type === 'categorical' && (
                        <>
                          {column.uniqueValues} distinct values
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <InsightsPanel data={datasetInfo.data} columns={datasetInfo.columns} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Analysis;