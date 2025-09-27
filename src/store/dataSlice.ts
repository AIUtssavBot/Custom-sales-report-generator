import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DatasetInfo, DataInsight, ChartConfig } from '../types';

interface DataState {
  rawData: any[] | null;
  datasetInfo: DatasetInfo | null;
  insights: DataInsight[];
  recommendedCharts: ChartConfig[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DataState = {
  rawData: null,
  datasetInfo: null,
  insights: [],
  recommendedCharts: [],
  isLoading: false,
  error: null,
};

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setRawData: (state, action: PayloadAction<any[]>) => {
      state.rawData = action.payload;
    },
    setDatasetInfo: (state, action: PayloadAction<DatasetInfo>) => {
      state.datasetInfo = action.payload;
    },
    setInsights: (state, action: PayloadAction<DataInsight[]>) => {
      state.insights = action.payload;
    },
    setRecommendedCharts: (state, action: PayloadAction<ChartConfig[]>) => {
      state.recommendedCharts = action.payload;
    },
    clearData: (state) => {
      state.rawData = null;
      state.datasetInfo = null;
      state.insights = [];
      state.recommendedCharts = [];
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setRawData,
  setDatasetInfo,
  setInsights,
  setRecommendedCharts,
  clearData,
} = dataSlice.actions;

export default dataSlice.reducer;