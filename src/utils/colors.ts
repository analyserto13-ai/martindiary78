import { PriorityLevel } from '../types';

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: '#4CAF50',    // Green
  medium: '#FFC107',  // Yellow/Amber
  high: '#F44336',    // Red
};

export const PRIORITY_BG_COLORS: Record<PriorityLevel, string> = {
  low: '#E8F5E9',
  medium: '#FFF8E1',
  high: '#FFEBEE',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const APP_THEME = {
  primary: '#5C6BC0',       // Indigo
  primaryDark: '#3F51B5',
  secondary: '#FF7043',     // Deep Orange accent
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#D32F2F',
  success: '#388E3C',
};

export const PRIORITY_ORDER: PriorityLevel[] = ['high', 'medium', 'low'];