export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
  department_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Department {
  id: number;
  name: string;
  created_at: Date;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  description_image_url: string | null;
  status: 'Open' | 'Pending' | 'Closed';
  created_by: number;
  assigned_department_id: number;
  deadline: Date;
  customer_name: string | null;
  customer_mobile: string | null;
  car_bought: string | null;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
}

export interface TicketWithDetails extends Ticket {
  creator_name: string;
  creator_email: string;
  department_name: string;
}

export interface AuthPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  description_image_url?: string;
  assigned_department_id: number;
  deadline?: Date;
  customer_name?: string;
  customer_mobile?: string;
  car_bought?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  description_image_url?: string;
  status?: 'Open' | 'Pending' | 'Closed';
  assigned_department_id?: number;
  deadline?: Date;
  customer_name?: string;
  customer_mobile?: string;
  car_bought?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  is_admin: boolean;
  department_id: number | null;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  is_active?: boolean;
  department_id?: number | null;
}

export interface TicketHistory {
  id: number;
  ticket_id: number;
  changed_by: number;
  change_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: Date;
}

export interface TicketHistoryWithDetails extends TicketHistory {
  changer_name: string;
  changer_department: string | null;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  comment_text: string;
  image_url: string | null;
  created_at: Date;
}

export interface TicketCommentWithDetails extends TicketComment {
  user_name: string;
  user_department: string | null;
}

export interface CreateCommentRequest {
  ticket_id: number;
  comment_text: string;
  image_url?: string;
}
