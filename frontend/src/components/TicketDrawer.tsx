import React, { useState, useEffect } from 'react';
import { Ticket, User, Comment, ActivityLog } from '../types';
import { api } from '../services/api';
import { UserAvatar } from './UserAvatar';
import { X, Send, UserPlus, MessageSquare, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TicketDrawerProps {
  ticket: Ticket | null;
  users: User[];
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  ticket,
  users,
  onClose,
  onTicketUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    if (ticket) {
      loadComments();
      loadActivities();
    }
  }, [ticket]);

  const loadComments = async () => {
    if (!ticket) return;
    setLoadingComments(true);
    try {
      const data = await api.getComments(ticket.id);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadActivities = async () => {
    if (!ticket) return;
    setLoadingActivities(true);
    try {
      const data = await api.getActivityLogs(ticket.id);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newComment.trim()) return;

    setPostingComment(true);
    try {
      await api.addComment(ticket.id, newComment);
      setNewComment('');
      await loadComments();
      await loadActivities();
      onTicketUpdated();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleAssignUser = async () => {
    if (!ticket || !selectedAssignee) return;
    try {
      await api.assignUser(ticket.id, selectedAssignee);
      setSelectedAssignee('');
      await loadActivities();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to assign user');
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!ticket) return;
    try {
      await api.unassignUser(ticket.id, userId);
      await loadActivities();
      onTicketUpdated();
    } catch (err) {
      console.error('Failed to unassign user:', err);
    }
  };

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-indigo-600 font-extrabold">{ticket.id}</span>
              <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                {ticket.status}
              </span>
              <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                {ticket.priority} Priority
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">{ticket.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description
            </h4>
            <div className="glass-panel p-4 text-sm text-slate-800 leading-relaxed border-slate-200 bg-slate-50">
              {ticket.description || <span className="italic text-slate-400">No description provided for this ticket.</span>}
            </div>
          </div>

          {/* Assignees Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Assigned Team Members
            </h4>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {ticket.assignees && ticket.assignees.length > 0 ? (
                ticket.assignees.map((a, i) => {
                  const uObj = typeof a.user_id === 'object' ? a.user_id : null;
                  const uName = uObj ? uObj.name || uObj.email : 'Team Member';
                  const uId = uObj ? uObj.id : (a.user_id as string);

                  return (
                    <div
                      key={i}
                      className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-slate-800 border-slate-200 bg-slate-50 shadow-sm"
                    >
                      <UserAvatar name={uName} size="sm" />
                      <span className="font-semibold">{uName}</span>
                      {currentUser?.role !== 'Employee' && (
                        <button
                          onClick={() => handleUnassignUser(uId)}
                          className="text-slate-400 hover:text-rose-600 ml-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400 italic">No assignees yet.</span>
              )}
            </div>

            {/* Assign User Select */}
            {currentUser?.role !== 'Employee' && (
              <div className="flex items-center gap-2 max-w-sm">
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="input-field py-1.5 text-xs"
                >
                  <option value="">Select team member to assign...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignUser}
                  disabled={!selectedAssignee}
                  className="btn-secondary text-xs py-1.5 px-3 shrink-0 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Assign
                </button>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-slate-200 my-4" />

          {/* Comments & Activity Stream Tabs */}
          <div>
            <div className="flex items-center gap-4 border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Activity className="w-4 h-4" />
                Activity Log ({activities.length})
              </button>
            </div>

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="input-field text-sm"
                  />
                  <button
                    type="submit"
                    disabled={postingComment || !newComment.trim()}
                    className="btn-primary py-2 px-4 shadow-indigo-500/20 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Comment Stream */}
                <div className="space-y-3 pt-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No comments yet. Start the conversation!
                    </p>
                  ) : (
                    comments.map((c) => {
                      const authorObj = typeof c.user_id === 'object' ? c.user_id : null;
                      const authorName = authorObj ? authorObj.name || authorObj.email || 'User' : 'User';

                      return (
                        <div key={c.id} className="glass-card p-3.5 border-slate-200 bg-white text-xs shadow-sm">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <UserAvatar name={authorName} size="sm" />
                              <span className="font-bold text-slate-900">{authorName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-700 pl-8 leading-normal">{c.comment}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-3 pt-1">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No activity recorded yet.
                  </p>
                ) : (
                  activities.map((a) => {
                    const actorObj = typeof a.user_id === 'object' ? a.user_id : null;
                    const actorName = actorObj ? actorObj.name || actorObj.email || 'User' : 'User';

                    return (
                      <div key={a.id} className="flex items-start gap-3 text-xs p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-slate-800">
                            <span className="font-bold text-slate-900">{actorName}</span>{' '}
                            <span className="font-mono text-indigo-600 font-bold">{a.action}</span>
                            {a.new_value && <span className="text-slate-600"> to "{a.new_value}"</span>}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
