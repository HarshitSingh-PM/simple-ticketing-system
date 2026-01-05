import { apiClient } from './client';
import type { DepartmentAnalytics, EmailStats } from '../types';

export const analyticsApi = {
  getAnalytics: async (): Promise<DepartmentAnalytics[]> => {
    const response = await apiClient.get<DepartmentAnalytics[]>('/analytics');
    return response.data;
  },
  getEmailStats: async (): Promise<EmailStats> => {
    const response = await apiClient.get<EmailStats>('/analytics/email-stats');
    return response.data;
  },
};
