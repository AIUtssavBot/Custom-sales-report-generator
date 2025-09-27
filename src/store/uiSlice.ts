import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Dashboard, ChartConfig } from '../types';

interface UiState {
  currentView: 'upload' | 'analysis' | 'dashboard';
  activeDashboard: Dashboard | null;
  selectedChartId: string | null;
  isDarkMode: boolean;
}

const initialState: UiState = {
  currentView: 'upload',
  activeDashboard: null,
  selectedChartId: null,
  isDarkMode: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<'upload' | 'analysis' | 'dashboard'>) => {
      state.currentView = action.payload;
    },
    setActiveDashboard: (state, action: PayloadAction<Dashboard | null>) => {
      state.activeDashboard = action.payload;
    },
    setSelectedChartId: (state, action: PayloadAction<string | null>) => {
      state.selectedChartId = action.payload;
    },
    addChartToDashboard: (state, action: PayloadAction<ChartConfig>) => {
      if (state.activeDashboard) {
        state.activeDashboard.charts.push(action.payload);
      }
    },
    updateChartConfig: (state, action: PayloadAction<{ id: string; config: Partial<ChartConfig> }>) => {
      if (state.activeDashboard) {
        const chartIndex = state.activeDashboard.charts.findIndex(chart => chart.id === action.payload.id);
        if (chartIndex !== -1) {
          state.activeDashboard.charts[chartIndex] = {
            ...state.activeDashboard.charts[chartIndex],
            ...action.payload.config,
          };
        }
      }
    },
    removeChartFromDashboard: (state, action: PayloadAction<string>) => {
      if (state.activeDashboard) {
        state.activeDashboard.charts = state.activeDashboard.charts.filter(chart => chart.id !== action.payload);
      }
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const {
  setCurrentView,
  setActiveDashboard,
  setSelectedChartId,
  addChartToDashboard,
  updateChartConfig,
  removeChartFromDashboard,
  toggleDarkMode,
} = uiSlice.actions;

export default uiSlice.reducer;