import { apiClient } from './client';
import type { Ticket, CreateTicketRequest, UpdateTicketRequest, TicketHistory } from '../types';

export const ticketsApi = {
  getAll: async (): Promise<Ticket[]> => {
    const response = await apiClient.get<Ticket[]>('/tickets');
    return response.data;
  },

  getByStatus: async (status: 'open' | 'closed'): Promise<Ticket[]> => {
    const response = await apiClient.get<Ticket[]>(`/tickets/status/${status}`);
    return response.data;
  },

  getMyDepartment: async (): Promise<Ticket[]> => {
    const response = await apiClient.get<Ticket[]>('/tickets/my-department');
    return response.data;
  },

  getById: async (id: number): Promise<Ticket> => {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: CreateTicketRequest): Promise<Ticket> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('assigned_department_id', data.assigned_department_id.toString());
    if (data.deadline) {
      formData.append('deadline', data.deadline);
    }
    if (data.customer_name) {
      formData.append('customer_name', data.customer_name);
    }
    if (data.customer_mobile) {
      formData.append('customer_mobile', data.customer_mobile);
    }
    if (data.car_bought) {
      formData.append('car_bought', data.car_bought);
    }
    if (data.description_image) {
      formData.append('description_image', data.description_image);
    }

    const response = await apiClient.post<Ticket>('/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateTicketRequest): Promise<Ticket> => {
    const response = await apiClient.put<Ticket>(`/tickets/${id}`, data);
    return response.data;
  },

  getHistory: async (id: number): Promise<TicketHistory[]> => {
    const response = await apiClient.get<TicketHistory[]>(`/tickets/${id}/history`);
    return response.data;
  },
};
