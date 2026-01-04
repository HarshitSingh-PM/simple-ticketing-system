import { apiClient } from './client';
import type { TicketComment, CreateCommentRequest } from '../types';

export const commentsApi = {
  getByTicketId: async (ticketId: number): Promise<TicketComment[]> => {
    const response = await apiClient.get<TicketComment[]>(`/comments/ticket/${ticketId}`);
    return response.data;
  },

  create: async (data: CreateCommentRequest): Promise<TicketComment> => {
    const formData = new FormData();
    formData.append('ticket_id', data.ticket_id.toString());
    formData.append('comment_text', data.comment_text);
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiClient.post<TicketComment>('/comments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: number, comment_text: string): Promise<TicketComment> => {
    const response = await apiClient.put<TicketComment>(`/comments/${id}`, { comment_text });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  },
};
