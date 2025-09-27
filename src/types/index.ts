// Define common types used throughout the application

export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text';
  uniqueValues?: number;
  missingValues?: number;
  missingPercentage?: number;
  min?: number | string | Date;
  max?: number | string | Date;
  mean?: number;
  median?: number;
  mode?: any;
  stdDev?: number;
  quartiles?: [number, number, number];
}

export interface DatasetInfo {
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: DataColumn[];
  data: any[];
  dataQuality: {
    missingValues: number;
    duplicateRows: number;
    outliers: number;
  };
}

export interface TimeTrend {
  dateColumn: string;
  valueColumn: string;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  seasonality?: boolean;
}

export interface Correlation {
  columns: [string, string];
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
}

export interface OutlierInfo {
  count: number;
  percentage: number;
  boundaries: {
    lower: number;
    upper: number;
  };
}

export interface Recommendation {
  type: 'trend' | 'correlation' | 'outlier' | 'data_volume' | 'data_type';
  message: string;
}

export interface Insights {
  timeTrends: TimeTrend[];
  correlations: Correlation[];
  outliers: Record<string, OutlierInfo>;
  recommendations: Recommendation[];
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram' | 'boxplot' | 'heatmap';
  title: string;
  xAxis?: string;
  yAxis?: string | string[];
  categoryField?: string;
  valueField?: string | string[];
  colorBy?: string;
  filters?: Record<string, any>;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  charts: ChartConfig[];
  filters: Record<string, any>;
}

export interface DataInsight {
  id: string;
  type: 'correlation' | 'trend' | 'outlier' | 'pattern' | 'kpi';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  relatedColumns: string[];
  suggestedVisualization?: ChartConfig;
}