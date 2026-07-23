import { User, Ticket, Comment, ActivityLog } from '../types';

const API_BASE = '/api';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const mockUserJson = localStorage.getItem('taskflow_user');
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (mockUserJson) {
    const user: User = JSON.parse(mockUserJson);
    headers['x-mock-user-uid'] = user.firebaseUid || user.id.replace('user:', '');
    headers['x-mock-user-name'] = user.name;
    headers['x-mock-user-email'] = user.email;
  }

  const token = localStorage.getItem('taskflow_firebase_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  login: async (userData: { uid: string; name: string; email: string }) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      headers: {
        'x-mock-user-uid': userData.uid,
        'x-mock-user-name': userData.name,
        'x-mock-user-email': userData.email,
      },
    });
  },

  getProfile: async (): Promise<User> => {
    const data = await fetchWithAuth('/auth/profile');
    return data.user;
  },

  getUsers: async (): Promise<User[]> => {
    const data = await fetchWithAuth('/users');
    return data.users || [];
  },

  getTickets: async (params?: { status?: string; assigneeId?: string }): Promise<Ticket[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.assigneeId) query.append('assigneeId', params.assigneeId);

    const data = await fetchWithAuth(`/tickets?${query.toString()}`);
    return data.tickets || [];
  },

  getTicketById: async (id: string): Promise<Ticket> => {
    const data = await fetchWithAuth(`/tickets/${id}`);
    return data.ticket;
  },

  createTicket: async (ticket: { title: string; description?: string; priority: string; status: string }): Promise<Ticket> => {
    const data = await fetchWithAuth('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
    return data.ticket;
  },

  updateTicket: async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const data = await fetchWithAuth(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.ticket;
  },

  deleteTicket: async (id: string): Promise<void> => {
    await fetchWithAuth(`/tickets/${id}`, {
      method: 'DELETE',
    });
  },

  assignUser: async (ticketId: string, userId: string): Promise<any> => {
    return fetchWithAuth(`/tickets/${ticketId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  unassignUser: async (ticketId: string, userId: string): Promise<void> => {
    await fetchWithAuth(`/tickets/${ticketId}/assign/${userId}`, {
      method: 'DELETE',
    });
  },

  getComments: async (ticketId: string): Promise<Comment[]> => {
    const data = await fetchWithAuth(`/tickets/${ticketId}/comments`);
    return data.comments || [];
  },

  addComment: async (ticketId: string, comment: string): Promise<Comment> => {
    const data = await fetchWithAuth(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    return data.comment;
  },

  getActivityLogs: async (ticketId: string): Promise<ActivityLog[]> => {
    const data = await fetchWithAuth(`/tickets/${ticketId}/activity`);
    return data.logs || [];
  },

  triggerReminders: async (): Promise<number> => {
    const data = await fetchWithAuth('/tickets/dev/trigger-reminders', {
      method: 'POST',
    });
    return data.processed_tickets_count;
  },

  updateUserRole: async (userId: string, role: string): Promise<any> => {
    const cleanId = userId.replace('user:', '');
    return fetchWithAuth(`/users/${cleanId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  getChats: async (): Promise<any[]> => {
    const data = await fetchWithAuth('/chats');
    return data.chats || [];
  },

  createChat: async (name: string, members: string[]): Promise<any> => {
    return fetchWithAuth('/chats', {
      method: 'POST',
      body: JSON.stringify({ name, members }),
    });
  },

  updateChatMembers: async (chatId: string, members: string[]): Promise<any> => {
    const cleanId = chatId.replace('chat:', '');
    return fetchWithAuth(`/chats/${cleanId}/members`, {
      method: 'PUT',
      body: JSON.stringify({ members }),
    });
  },

  getChatMessages: async (chatId: string): Promise<any[]> => {
    const cleanId = chatId.replace('chat:', '');
    const data = await fetchWithAuth(`/chats/${cleanId}/messages`);
    return data.messages || [];
  },

  sendChatMessage: async (chatId: string, message: string): Promise<any> => {
    const cleanId = chatId.replace('chat:', '');
    return fetchWithAuth(`/chats/${cleanId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};
