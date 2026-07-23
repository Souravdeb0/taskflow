import React from 'react';
import { Ticket, TicketStatus } from '../types';
import { UserAvatar } from './UserAvatar';
import { ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface KanbanBoardProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

const columns: { status: TicketStatus; label: string; icon: any; color: string; countBg: string }[] = [
  { status: 'Todo', label: 'To Do', icon: Clock, color: 'from-slate-600 to-slate-700', countBg: 'bg-slate-100 text-slate-700' },
  { status: 'In Progress', label: 'In Progress', icon: AlertCircle, color: 'from-blue-600 to-indigo-600', countBg: 'bg-blue-50 text-blue-700' },
  { status: 'Done', label: 'Completed', icon: CheckCircle2, color: 'from-emerald-600 to-teal-600', countBg: 'bg-emerald-50 text-emerald-700' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  onSelectTicket,
  onStatusChange,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {columns.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.status);
        const IconComponent = col.icon;

        return (
          <div
            key={col.status}
            className="glass-panel p-4 flex flex-col min-h-[500px] border-slate-200 bg-slate-100/50"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg bg-gradient-to-r ${col.color} text-white shadow-sm`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{col.label}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${col.countBg}`}>
                  {colTickets.length}
                </span>
              </div>
            </div>

            {/* Column Ticket Cards */}
            <div className="space-y-3 flex-1">
              {colTickets.length === 0 ? (
                <div className="h-36 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium bg-white/50">
                  No tickets in {col.label.toLowerCase()}
                </div>
              ) : (
                colTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="glass-card p-4 cursor-pointer group hover:border-indigo-400 transition-all relative overflow-hidden bg-white border-slate-200 shadow-sm hover:shadow-md"
                  >
                    {/* Priority bar */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        ticket.priority === 'High'
                          ? 'bg-rose-500'
                          : ticket.priority === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />

                    <div className="flex items-start justify-between gap-2 mb-1.5 pt-1">
                      <span className="text-[11px] font-mono text-indigo-600 font-extrabold">
                        {typeof ticket.id === 'string' ? ticket.id : String((ticket.id as any)?.id || ticket.id || '')}
                      </span>
                      <span className={`badge badge-${(ticket.priority || 'Low').toLowerCase()}`}>
                        {ticket.priority || 'Low'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
                      {ticket.title}
                    </h4>

                    {ticket.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        {ticket.assignees && ticket.assignees.length > 0 ? (
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {ticket.assignees.slice(0, 3).map((a, i) => {
                              const uName =
                                typeof a.user_id === 'object'
                                  ? a.user_id.name || a.user_id.email
                                  : 'Assigned User';
                              return <UserAvatar key={i} name={uName} size="sm" />;
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick Move Selector */}
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            onStatusChange(ticket.id, e.target.value as TicketStatus);
                          }}
                          value={ticket.status}
                          className="bg-slate-50 text-[10px] text-slate-700 font-bold border border-slate-200 rounded-md px-1.5 py-0.5 focus:outline-none hover:border-indigo-500"
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
