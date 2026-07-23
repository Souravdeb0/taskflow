import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ticket, User, TicketStatus } from '../types';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { KanbanBoard } from '../components/KanbanBoard';
import { TicketList } from '../components/TicketList';
import { AnalyticsView } from '../components/AnalyticsView';
import { TicketModal } from '../components/TicketModal';
import { TicketDrawer } from '../components/TicketDrawer';
import { ChatView } from '../components/ChatView';
import { AdminPanel } from '../components/AdminPanel';
import { SkeletonBoard, SkeletonList } from '../components/SkeletonLoader';
import { LayoutGrid, ListFilter, BarChart2, Filter, RefreshCw, MessageSquare, ShieldAlert } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'analytics' | 'chats' | 'users'>('board');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Reminders
  const [isTriggeringReminders, setIsTriggeringReminders] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsData, usersData] = await Promise.all([
        api.getTickets(),
        api.getUsers().catch(() => []),
      ]);
      setTickets(ticketsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (data: any) => {
    await api.createTicket(data);
    await loadData();
  };

  const handleUpdateTicket = async (data: any) => {
    if (!editingTicket) return;
    await api.updateTicket(editingTicket.id, data);
    await loadData();
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    await api.deleteTicket(ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    await loadData();
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    // If Employee, check if they are assigned to this ticket
    if (user?.role === 'Employee') {
      const ticket = tickets.find(t => t.id === ticketId);
      const isAssigned = ticket?.assignees?.some(a => {
        const uId = typeof a.user_id === 'object' ? a.user_id?.id : a.user_id;
        return uId === user?.id;
      });
      if (!isAssigned) {
        alert('Forbidden: Employees can only update the status of tickets assigned to them.');
        return;
      }
    }

    try {
      await api.updateTicket(ticketId, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleTriggerReminders = async () => {
    setIsTriggeringReminders(true);
    try {
      const count = await api.triggerReminders();
      alert(`Reminders processed! Checked ${count} inactive tickets.`);
    } catch (err: any) {
      alert('Failed to trigger reminders: ' + err.message);
    } finally {
      setIsTriggeringReminders(false);
    }
  };

  // Filter tickets by search, status, and assignee
  const filteredTickets = tickets.filter((t) => {
    if (!t) return false;
    const ticketIdStr = typeof t.id === 'string' ? t.id : String((t.id as any)?.id || t.id || '');
    const titleStr = typeof t.title === 'string' ? t.title : String(t.title || '');
    const descStr = typeof t.description === 'string' ? t.description : '';

    const matchesSearch =
      titleStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticketIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === 'all' ||
      (t.assignees &&
        t.assignees.some((a) => {
          const uId = typeof a.user_id === 'object' ? a.user_id?.id : a.user_id;
          return uId === assigneeFilter;
        }));

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenCreateModal={() => {
          setEditingTicket(null);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTriggerReminders={handleTriggerReminders}
          isTriggeringReminders={isTriggeringReminders}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 bg-white border-slate-200 shadow-sm">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'board'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Board
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'chats'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chats
              </button>
              {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'users'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Todo">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadData}
                title="Refresh Data"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tab Views */}
          {loading ? (
            activeTab === 'list' ? <SkeletonList /> : <SkeletonBoard />
          ) : activeTab === 'board' ? (
            <KanbanBoard
              tickets={filteredTickets}
              onSelectTicket={setSelectedTicket}
              onStatusChange={handleStatusChange}
            />
          ) : activeTab === 'list' ? (
            <TicketList
              tickets={filteredTickets}
              onSelectTicket={setSelectedTicket}
              onEditTicket={user?.role !== 'Employee' ? (t) => {
                setEditingTicket(t);
                setIsCreateModalOpen(true);
              } : undefined}
              onDeleteTicket={user?.role !== 'Employee' ? handleDeleteTicket : undefined}
              onStatusChange={handleStatusChange}
            />
          ) : activeTab === 'chats' ? (
            <ChatView />
          ) : activeTab === 'users' && (user?.role === 'Admin' || user?.role === 'SuperAdmin') ? (
            <AdminPanel />
          ) : (
            <AnalyticsView tickets={tickets} />
          )}
        </main>
      </div>

      {/* Ticket Modal (Create / Edit) */}
      <TicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={editingTicket ? handleUpdateTicket : handleCreateTicket}
        initialData={editingTicket}
      />

      {/* Ticket Slide-Over Detail Drawer */}
      <TicketDrawer
        ticket={selectedTicket}
        users={users}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={loadData}
      />
    </div>
  );
};
