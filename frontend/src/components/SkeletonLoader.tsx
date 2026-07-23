import React from 'react';

export const SkeletonBoard: React.FC = () => {
  const columns = ['Todo', 'In Progress', 'Done'];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {columns.map((col, index) => (
        <div key={index} className="flex flex-col gap-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 min-h-[500px]">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
            <div className="h-4 bg-slate-200 rounded-md w-24"></div>
            <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
          </div>
          
          {/* Skeleton Cards */}
          <div className="space-y-3.5 mt-2">
            {[1, 2, 3].map((cardIndex) => (
              <div key={cardIndex} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3">
                {/* Priority & Date Line */}
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded-full w-12"></div>
                  <div className="h-3 bg-slate-200 rounded-md w-16"></div>
                </div>
                
                {/* Title */}
                <div className="space-y-1.5 mt-1">
                  <div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
                  <div className="h-3 bg-slate-200 rounded-md w-2/3"></div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-1"></div>

                {/* Footer Avatar + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                    <div className="h-3 bg-slate-200 rounded-md w-16"></div>
                  </div>
                  <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC = () => {
  return (
    <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              {['Id', 'Ticket', 'Status', 'Priority', 'Assignee', 'Created', 'Actions'].map((header, idx) => (
                <th key={idx} className="p-4">
                  <div className="h-3.5 bg-slate-200 rounded-md w-16"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50">
                <td className="p-4"><div className="h-3 bg-slate-200 rounded-md w-8"></div></td>
                <td className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-48"></div>
                    <div className="h-3 bg-slate-200 rounded-md w-24"></div>
                  </div>
                </td>
                <td className="p-4"><div className="h-5 bg-slate-200 rounded-full w-20"></div></td>
                <td className="p-4"><div className="h-5 bg-slate-200 rounded-full w-14"></div></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                    <div className="h-3 bg-slate-200 rounded-md w-16"></div>
                  </div>
                </td>
                <td className="p-4"><div className="h-3 bg-slate-200 rounded-md w-20"></div></td>
                <td className="p-4"><div className="w-6 h-6 bg-slate-200 rounded-md ml-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
