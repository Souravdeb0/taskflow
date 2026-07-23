import React, { useState, useEffect } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { X, Sparkles, AlertCircle } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: {
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
  }) => Promise<void>;
  initialData?: Ticket | null;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TicketStatus>('Todo');
  const [priority, setPriority] = useState<TicketPriority>('Low');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
      setPriority(initialData.priority);
    } else {
      setTitle('');
      setDescription('');
      setStatus('Todo');
      setPriority('Low');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title,
        description,
        status,
        priority,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg p-6 border-slate-200 bg-white shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              {initialData ? 'Edit Ticket' : 'Create New Ticket'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Ticket Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Add detailed context, steps to reproduce, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="input-field cursor-pointer font-semibold"
              >
                <option value="Todo">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="input-field cursor-pointer font-semibold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm shadow-indigo-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Ticket' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
