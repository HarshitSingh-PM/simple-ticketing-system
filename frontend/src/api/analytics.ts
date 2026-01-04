import { apiClient } from './client';
import type { DepartmentAnalytics } from '../types';

export const analyticsApi = {
  getAnalytics: async (): Promise<DepartmentAnalytics[]> => {
    const response = await apiClient.get<DepartmentAnalytics[]>('/analytics');
    return response.data;
  },
};
