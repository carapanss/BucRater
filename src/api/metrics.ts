import { invoke } from '@tauri-apps/api/core';
import type { GlobalMetrics, YearMetrics } from '../types';

export const getYearMetrics = (year: number) => invoke<YearMetrics>('get_year_metrics', { year });

export const getGlobalMetrics = () => invoke<GlobalMetrics>('get_global_metrics');
