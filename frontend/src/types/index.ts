export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  departmentId: number | null;
  departmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  description_image_url: string | null;
  status: 'Open' | 'Pending' | 'Closed';
  created_by: number;
  assigned_department_id: number;
  deadline: string;
  customer_name: string | null;
  customer_mobile: string | null;
  car_bought: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  creator_name: string;
  creator_email: string;
  department_name: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  description_image?: File;
  assigned_department_id: number;
  deadline?: string;
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
  deadline?: string;
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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
  created_at: string;
  changer_name: string;
  changer_department: string | null;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  comment_text: string;
  image_url: string | null;
  created_at: string;
  user_name: string;
  user_department: string | null;
}

export interface CreateCommentRequest {
  ticket_id: number;
  comment_text: string;
  image?: File;
}

export interface DepartmentAnalytics {
  department_id: number;
  department_name: string;
  open_tickets: number;
  closed_tickets: number;
  closed_on_time: number;
  closed_delayed: number;
}

export interface EmailTypeCount {
  email_type: string;
  count: number;
}

export interface EmailStats {
  today: {
    total: number;
    byType: EmailTypeCount[];
    successful: number;
    failed: number;
  };
  month: {
    total: number;
    byType: EmailTypeCount[];
  };
}
