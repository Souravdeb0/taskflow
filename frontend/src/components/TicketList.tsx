import React from 'react';
import { Ticket, TicketStatus } from '../types';
import { UserAvatar } from './UserAvatar';
import { Trash2, Edit3 } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  onSelectTicket,
  onEditTicket,
  onDeleteTicket,
  onStatusChange,
}) => {
  return (
    <div className="glass-panel overflow-hidden border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Ticket ID</th>
              <th className="py-3.5 px-4">Title & Description</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Assignees</th>
              <th className="py-3.5 px-4">Updated</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                  No tickets found matching your current filter.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-extrabold whitespace-nowrap">
                    {typeof ticket.id === 'string' ? ticket.id : String((ticket.id as any)?.id || ticket.id || '')}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {ticket.title}
                    </p>
                    {ticket.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{ticket.description}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={ticket.status || 'Todo'}
                      onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
                      className={`badge badge-${(ticket.status || 'Todo').toLowerCase().replace(' ', '-')} bg-transparent cursor-pointer focus:outline-none`}
                    >
                      <option value="Todo" className="bg-white text-slate-700">Todo</option>
                      <option value="In Progress" className="bg-white text-blue-600">In Progress</option>
                      <option value="Done" className="bg-white text-emerald-600">Done</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`badge badge-${(ticket.priority || 'Low').toLowerCase()}`}>
                      {ticket.priority || 'Low'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {ticket.assignees && ticket.assignees.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {ticket.assignees.map((a, i) => {
                          const name = typeof a.user_id === 'object' ? a.user_id.name || a.user_id.email : 'User';
                          return <UserAvatar key={i} name={name} size="sm" />;
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}
                  </td>
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {onEditTicket && (
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Ticket"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteTicket && (
                        <button
                          onClick={() => onDeleteTicket(ticket.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
