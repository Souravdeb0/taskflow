import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Shield, ShieldAlert, CheckCircle, RefreshCw, UserCheck } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      setMessage({ text: 'Failed to load user list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setMessage(null);
    try {
      await api.updateUserRole(userId, newRole);
      setMessage({ text: `User role updated successfully to ${newRole}!`, type: 'success' });
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Failed to update user role', type: 'error' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="glass-panel p-6 bg-white border-slate-200 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">Admin Control Center</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage user roles and assign organizational positions (Admin, Manager, Employee)
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Users
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Shield className="w-4 h-4 text-rose-600" />}
          {message.text}
        </div>
      )}

      {/* Users list table */}
      <div className="glass-panel border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            Loading team members...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            No users registered in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">User ID / Uid</th>
                  <th className="p-4">Current Position</th>
                  <th className="p-4 text-right">Assign Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-indigo-600 border border-slate-200">
                        {u.name ? u.name[0].toUpperCase() : '?'}
                      </div>
                      {u.name || 'Unnamed User'}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{u.email}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      <div>{u.id}</div>
                      <div className="text-[10px] text-slate-300">Uid: {u.firebaseUid || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        u.role === 'SuperAdmin' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none shadow-sm' :
                        u.role === 'Admin' ? 'badge-high' :
                        u.role === 'Manager' ? 'badge-in-progress' :
                        'badge-todo'
                      }`}>
                        {u.role || 'Employee'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {updatingUserId === u.id && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        )}
                        <select
                          value={u.role || 'Employee'}
                          disabled={updatingUserId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Employee">Employee</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
