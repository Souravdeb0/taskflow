import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  ArrowRight,
  LayoutGrid,
  MessageSquare,
  Shield,
  Users,
  BarChart2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
              <Zap className="w-5 h-5 text-white fill-white/20" />
            </div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              Task<span className="gradient-text">Flow</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#roles" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Roles</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary text-sm py-2.5 px-5 cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer hidden sm:block"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login?mode=signup')}
                  className="btn-primary text-sm py-2.5 px-5 cursor-pointer"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-20 pb-28 px-6">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-100/60 via-purple-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-20 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-20 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-serif-display font-normal text-slate-900 leading-[0.9] mb-8 animate-fade-in">
            Manage Tasks.{' '}
            <span className="gradient-text italic font-normal">Collaborate.</span>
            <br />
            Ship Faster.
          </h1>

          <p className="text-xs uppercase tracking-widest font-accent-mono text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in">
            // Unified workspace interface featuring role-based access control, integrated group chats, and drag-and-drop workflow tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <button
              onClick={handleGetStarted}
              className="btn-primary text-xs uppercase tracking-wider font-accent-mono py-3.5 px-8 rounded-xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/35 cursor-pointer"
            >
              {user ? 'Open Workspace' : 'Initialize Session'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="btn-secondary text-xs uppercase tracking-wider font-accent-mono py-3.5 px-8 rounded-xl cursor-pointer"
            >
              Explore Schema
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Trust bar */}
          <div className="mt-16 flex items-center justify-center gap-6 text-[10px] uppercase tracking-wider font-accent-mono text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              OSS CORE
            </span>
            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              ROLE-BASED ACL
            </span>
            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              REALTIME WS
            </span>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
              Powerful Features
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] mb-4">
              Everything your team needs
            </h2>
            <p className="text-base text-slate-500 font-medium max-w-xl mx-auto">
              From task tracking to team communication, TaskFlow has the tools to keep your projects moving forward.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-7 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <LayoutGrid className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-2">
                Kanban Board
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Drag and drop tasks across columns. Visualize your workflow with To-Do, In Progress, and Done stages.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-7 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-2">
                Team Chat
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Create group channels, add or remove team members, and communicate in real-time with your team.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-7 rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-2">
                Role-Based Access
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Admins manage positions. Managers assign tasks and create chats. Employees focus on their work.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-7 rounded-2xl border border-slate-200 bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 group-hover:bg-amber-100 transition-colors">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-2">
                Admin Control Panel
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                View all team members and dynamically assign organizational positions like Admin, Manager, or Employee.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-7 rounded-2xl border border-slate-200 bg-white hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5 group-hover:bg-rose-100 transition-colors">
                <BarChart2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-2">
                Analytics Dashboard
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Track progress with real-time charts showing task distribution, completion rates, and team performance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-7 rounded-2xl border border-slate-200 bg-white hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-5 group-hover:bg-cyan-100 transition-colors">
                <Zap className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-2">
                Google & Email Auth
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Secure authentication powered by Firebase. Sign in with Google or create an account with email and password.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
              Simple Workflow
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] mb-4">
              Get started in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 text-white font-extrabold text-lg font-['Outfit'] shadow-lg shadow-indigo-500/20">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] mb-2">
                Create Your Account
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Sign up instantly with Google or email. Your workspace is ready in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-5 text-white font-extrabold text-lg font-['Outfit'] shadow-lg shadow-purple-500/20">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] mb-2">
                Organize Your Team
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Admins assign roles. Managers create tasks and chat channels for their team.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-5 text-white font-extrabold text-lg font-['Outfit'] shadow-lg shadow-pink-500/20">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] mb-2">
                Ship & Collaborate
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Track tasks on the Kanban board, chat in real-time, and deliver projects on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Roles Breakdown ─── */}
      <section id="roles" className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
              Role-Based System
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] mb-4">
              Built for every team member
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin */}
            <div className="relative p-7 rounded-2xl border-2 border-rose-200 bg-gradient-to-b from-rose-50/50 to-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <span className="badge badge-high mb-4">Admin</span>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-3">
                  Full Control
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    Assign roles (Admin, Manager, Employee)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    Create and manage all tasks
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    Create chat channels and manage members
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    Access analytics and full dashboard
                  </li>
                </ul>
              </div>
            </div>

            {/* Manager */}
            <div className="relative p-7 rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <span className="badge badge-in-progress mb-4">Manager</span>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-3">
                  Team Leader
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    Create tasks and assign to employees
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    Create common chat channels
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    Add or remove employees from chats
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    View analytics and track progress
                  </li>
                </ul>
              </div>
            </div>

            {/* Employee */}
            <div className="relative p-7 rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50/50 to-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <span className="badge badge-todo mb-4">Employee</span>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-3">
                  Focused Worker
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    View and update assigned tasks
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    Communicate in assigned chat channels
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    Update task status and add comments
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    View personal workload and analytics
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Outfit'] mb-5">
            Ready to streamline your workflow?
          </h2>
          <p className="text-base text-white/70 font-medium max-w-xl mx-auto mb-10">
            Join TaskFlow today and experience the power of role-based project management with real-time collaboration.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-base py-3.5 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-indigo-50 transition-all cursor-pointer"
          >
            {user ? 'Go to Dashboard' : 'Get Started — It\'s Free'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 bg-slate-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white font-['Outfit']">TaskFlow</span>
        </div>
        <p className="text-xs text-slate-500">
          Built with React, TypeScript, SurrealDB & Firebase. © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};
