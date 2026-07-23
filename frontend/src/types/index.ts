export interface User {
  id: string; // user:uid
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
}

export type TicketStatus = 'Todo' | 'In Progress' | 'Done';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface TicketAssignee {
  id: string;
  assigned_at: string;
  assigned_by?: User | string;
  user_id: User | string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: User | { id: string; name?: string; email?: string };
  comment: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  ticket_id: string;
  user_id: User | { id: string; name?: string; email?: string };
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_by?: User | string;
  created_at: string;
  updated_at: string;
  assignees: TicketAssignee[];
  comments?: Comment[];
}
