import { apiClient } from './client';
import type { DashboardData } from '../types';

export const getDashboardStats = async (): Promise<DashboardData> => {
  const { data } = await apiClient.get<DashboardData>('/dashboard');
  return data;
};
