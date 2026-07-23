import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { Zap, LogOut, Bell, Search, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  onSearchChange,
  onOpenCreateModal,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Brand Logo */}
      <Link to="/dashboard" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600/20" />
          </div>
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5 font-['Outfit']">
            Task<span className="gradient-text">Flow</span>
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          </span>
          <span className="text-[10px] tracking-wider font-bold uppercase text-indigo-600 block -mt-1">
            Enterprise Issue Tracker
          </span>
        </div>
      </Link>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search tickets by title, id, or priority..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
        />
      </div>

      {/* User Controls & Actions */}
      <div className="flex items-center gap-3">
        {user?.role !== 'Employee' && (
          <button
            onClick={onOpenCreateModal}
            className="btn-primary text-sm shadow-indigo-500/20"
          >
            <span className="text-lg leading-none">+</span> New Ticket
          </button>
        )}

        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

        {user && (
          <div className="flex items-center gap-2 pl-1">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title="View Profile"
            >
              <UserAvatar name={user.name} size="md" />
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[10px] font-medium text-slate-500">{user.role}</p>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
