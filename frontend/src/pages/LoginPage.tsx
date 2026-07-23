import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { Zap, ArrowLeft, Lock, Mail, User, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Authentication failed.';
      if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-slate-50">
      {/* ─── Left: Decorative Brand Panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Radial overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />

        {/* Floating circles */}
        <div className="absolute top-20 left-16 w-32 h-32 border border-white/10 rounded-full" />
        <div className="absolute bottom-32 right-20 w-48 h-48 border border-white/10 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/5 rounded-full" />

        <div className="flex flex-col justify-between p-12 relative z-10 w-full">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/25 transition-colors">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white font-['Outfit']">
              TaskFlow
            </span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-5xl font-serif-display font-normal text-white leading-[0.95]">
              Empower your team<br />
              to do their<br />
              <span className="text-white/80 italic">best work.</span>
            </h2>
            <p className="text-sm text-white/60 font-medium max-w-sm leading-relaxed">
              Real-time collaboration, role-based access, and beautiful task management — all in one place.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[10px] uppercase tracking-wider font-accent-mono text-white/90">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Kanban Board
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[10px] uppercase tracking-wider font-accent-mono text-white/90">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                Team Chat
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[10px] uppercase tracking-wider font-accent-mono text-white/90">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                Role Control
              </span>
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-wider font-accent-mono text-white/30 font-medium">
            © {new Date().getFullYear()} TaskFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* ─── Right: Auth Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="space-y-2">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 font-['Outfit']">
                Task<span className="gradient-text">Flow</span>
              </span>
            </div>

            <h1 className="text-4xl font-serif-display font-normal text-slate-900 leading-[0.95]">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {mode === 'login'
                ? 'Sign in to access your workspace and continue where you left off.'
                : 'Get started with TaskFlow and manage your projects effectively.'
              }
            </p>
          </div>

          {/* Google Sign-in */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-xs uppercase tracking-wider font-accent-mono text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-accent-mono">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-accent-mono flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field text-sm"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-accent-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-field text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-accent-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10 text-sm"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-xs uppercase tracking-wider font-accent-mono py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating...'}
                </span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(null); }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
