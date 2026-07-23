import React from 'react';
import { Ticket } from '../types';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, ShieldCheck, Flame } from 'lucide-react';

interface AnalyticsViewProps {
  tickets: Ticket[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tickets }) => {
  const total = tickets.length;
  const todoCount = tickets.filter((t) => t.status === 'Todo').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const doneCount = tickets.filter((t) => t.status === 'Done').length;

  const highCount = tickets.filter((t) => t.priority === 'High').length;
  const mediumCount = tickets.filter((t) => t.priority === 'Medium').length;
  const lowCount = tickets.filter((t) => t.priority === 'Low').length;

  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 bg-white border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tickets</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{total}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 bg-white border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completion Rate</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{completionRate}%</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 bg-white border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">In Progress</p>
              <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{inProgressCount}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 bg-white border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">High Priority</p>
              <h3 className="text-3xl font-extrabold text-rose-600 mt-1">{highCount}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Flame className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass-panel p-6 bg-white border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            Status Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">To Do ({todoCount})</span>
                <span className="text-slate-500">{total ? Math.round((todoCount / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-slate-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total ? (todoCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-600">In Progress ({inProgressCount})</span>
                <span className="text-blue-600">{total ? Math.round((inProgressCount / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total ? (inProgressCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-600">Completed ({doneCount})</span>
                <span className="text-emerald-600">{total ? Math.round((doneCount / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="glass-panel p-6 bg-white border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Priority Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-600">High Priority ({highCount})</span>
                <span className="text-rose-600">{total ? Math.round((highCount / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total ? (highCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-600">Medium Priority ({mediumCount})</span>
                <span className="text-amber-600">{total ? Math.round((mediumCount / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total ? (mediumCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600">Low Priority ({lowCount})</span>
                <span className="text-slate-600">{total ? Math.round((lowCount / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-slate-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total ? (lowCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
