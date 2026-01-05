import { apiClient } from './client';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  changePassword: async (id: number, newPassword: string): Promise<void> => {
    await apiClient.post(`/users/${id}/change-password`, { newPassword });
  },

  deactivate: async (id: number): Promise<void> => {
    await apiClient.post(`/users/${id}/deactivate`);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
