import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, ActivityLog } from '../types';
import { api } from '../services/api';
import { UserAvatar } from '../components/UserAvatar';
import { Navbar } from '../components/Navbar';
import {
  UserCheck,
  Mail,
  Shield,
  Key,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  LogOut,
  Sparkles,
  Activity,
  Award
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfileData();
    }
  }, [user]);

  const loadUserProfileData = async () => {
    setLoading(true);
    try {
      if (user) {
        const uId = user.id.replace('user:', '');
        const allTickets = await api.getTickets({ assigneeId: uId });
        setAssignedTickets(allTickets);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const completedCount = assignedTickets.filter((t) => t.status === 'Done').length;
  const inProgressCount = assignedTickets.filter((t) => t.status === 'In Progress').length;
  const todoCount = assignedTickets.filter((t) => t.status === 'Todo').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar searchTerm="" onSearchChange={() => {}} onOpenCreateModal={() => navigate('/dashboard')} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Profile Card Banner */}
        <div className="glass-panel p-8 bg-white border-slate-200 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            {/* Avatar */}
            <UserAvatar name={user.name} size="lg" />

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
                  {user.name}
                </h1>
                <span className="badge badge-in-progress bg-indigo-50 text-indigo-700 border-indigo-200 self-center md:self-auto">
                  {user.role}
                </span>
              </div>

              <p className="text-sm text-slate-500 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {user.email}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  <Key className="w-3.5 h-3.5 text-indigo-500" />
                  ID: {user.id}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  UID: {user.firebaseUid}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 bg-white border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{assignedTickets.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-5 bg-white border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{inProgressCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-5 bg-white border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Assigned Tickets Section */}
        <div className="glass-panel p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            My Assigned Tickets ({assignedTickets.length})
          </h3>

          {loading ? (
            <p className="text-xs text-slate-400 italic">Loading assigned tickets...</p>
          ) : assignedTickets.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No tickets currently assigned to your account.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignedTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate('/')}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-3 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="space-y-1 max-w-md">
                    <span className="font-mono text-xs font-bold text-indigo-600">{t.id}</span>
                    <h4 className="font-semibold text-sm text-slate-900">{t.title}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge badge-${t.status.toLowerCase().replace(' ', '-')}`}>
                      {t.status}
                    </span>
                    <span className={`badge badge-${t.priority.toLowerCase()}`}>
                      {t.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
