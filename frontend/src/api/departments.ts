import { apiClient } from './client';
import type { Department } from '../types';

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/departments');
    return response.data;
  },

  create: async (name: string): Promise<Department> => {
    const response = await apiClient.post<Department>('/departments', { name });
    return response.data;
  },

  getUsersByDepartment: async (departmentId: number): Promise<any[]> => {
    const response = await apiClient.get(`/departments/${departmentId}/users`);
    return response.data;
  },
};
