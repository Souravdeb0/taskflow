import React from 'react';
import { LayoutGrid, ListFilter, BarChart2, BellRing, User, MessageSquare, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: 'board' | 'list' | 'analytics' | 'chats' | 'users';
  onTabChange: (tab: 'board' | 'list' | 'analytics' | 'chats' | 'users') => void;
  onTriggerReminders: () => void;
  isTriggeringReminders: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onTriggerReminders,
  isTriggeringReminders,
}) => {
  const { user } = useAuth();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Views
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => onTabChange('board')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'board'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className={`w-4 h-4 ${activeTab === 'board' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Kanban Board
            </button>

            <button
              onClick={() => onTabChange('list')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListFilter className={`w-4 h-4 ${activeTab === 'list' ? 'text-indigo-600' : 'text-slate-400'}`} />
              All Tickets List
            </button>

            <button
              onClick={() => onTabChange('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Metrics & Analytics
            </button>

            <button
              onClick={() => onTabChange('chats')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'chats'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'chats' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Common Chats
            </button>

            {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
              <button
                onClick={() => onTabChange('users')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 ${activeTab === 'users' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Admin Panel
              </button>
            )}
          </nav>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Account & Tools
          </p>
          <div className="space-y-1">
            <Link
              to="/profile"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              <User className="w-4 h-4 text-slate-400" />
              My Profile
            </Link>

            <button
              onClick={onTriggerReminders}
              disabled={isTriggeringReminders}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all disabled:opacity-50"
            >
              <span className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4 text-amber-600" />
                Trigger Reminders
              </span>
              {isTriggeringReminders && <span className="text-[10px] animate-pulse text-amber-600">Running...</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Database status footer card */}
      <div className="glass-panel p-3.5 border-slate-200 bg-slate-50 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-500 font-semibold">SurrealDB Status</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-[11px] text-slate-700 font-mono">NS: taskflow | DB: taskflow</p>
      </div>
    </aside>
  );
};
