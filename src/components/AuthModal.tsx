import React, { useState } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_USER, DEMO_PROFILES, setStoredUser } from '../utils/auth';
import { signInWithGooglePopup } from '../utils/googleAuth';
import { 
  X, Mail, Lock, User, Eye, EyeOff, CheckCircle2, 
  ShieldCheck, ArrowRight, Sparkles, LogIn, Award
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('shakthiprasadp070@gmail.com');
  const [password, setPassword] = useState('Minervini@2024');
  const [name, setName] = useState('Shakthi Prasad');
  const [role, setRole] = useState<'Pro Trader' | 'Individual' | 'Institutional'>('Pro Trader');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGooglePopup();
      if (rememberMe) {
        setStoredUser(result.userProfile);
      }
      onLoginSuccess(result.userProfile);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      // If popup was closed or network error, provide a friendly message and allow fallback
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const authenticatedUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: tab === 'signup' ? (name || email.split('@')[0]) : (email === DEFAULT_USER.email ? DEFAULT_USER.name : email.split('@')[0]),
        email: email.trim().toLowerCase(),
        role: role,
        joinedDate: 'Sep 2024',
        lastLogin: 'Just now',
        savedWatchlist: email === DEFAULT_USER.email ? DEFAULT_USER.savedWatchlist : ['NVDA', 'TRENT.NS'],
        alertPreferences: {
          emailAlerts: true,
          minScoreAlert: 7,
          minAdxAlert: 25,
          frequency: 'daily_digest',
        },
      };

      if (rememberMe) {
        setStoredUser(authenticatedUser);
      }
      onLoginSuccess(authenticatedUser);
      onClose();
    }, 450);
  };

  const handleQuickLogin = (demoProfile: UserProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStoredUser(demoProfile);
      onLoginSuccess(demoProfile);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Trader Account Access</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  SEPA Cloud
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Sync watchlist, custom alerts, and Gmail breakout alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => { setTab('signin'); setError(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'signin' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'signup' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Google Sign-In with Gmail Integration Button */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block flex items-center justify-between">
              <span>Continue with Google</span>
              <span className="text-emerald-400 font-normal lowercase text-[10px]">with Gmail alerts</span>
            </span>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 p-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs rounded-xl shadow-md transition border border-zinc-200 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting to Google...' : tab === 'signup' ? 'Sign up with Google (Gmail)' : 'Sign in with Google (Gmail)'}</span>
            </button>
          </div>

          {/* Quick Sign-In Option for Default Account */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Or 1-Click Trader Session
            </span>
            <button
              type="button"
              onClick={() => handleQuickLogin(DEFAULT_USER)}
              className="w-full flex items-center justify-between p-2.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-emerald-500/40 rounded-xl text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                  SP
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition">
                    Shakthi Prasad
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    shakthiprasadp070@gmail.com
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span>Sign in</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="bg-zinc-950 px-2 text-[10px] text-zinc-500 uppercase tracking-wider font-mono absolute">
              or standard email
            </span>
          </div>

          {/* Name Field (Sign Up only) */}
          {tab === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shakthi Prasad"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 outline-none transition"
                />
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-zinc-100 outline-none transition"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-300">
                Password
              </label>
              {tab === 'signin' && (
                <button
                  type="button"
                  onClick={() => alert('Password reset link will be sent to ' + email)}
                  className="text-[11px] text-zinc-500 hover:text-emerald-400 transition"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-10 py-2 text-xs font-mono text-zinc-100 outline-none transition"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selector (Sign up) */}
          {tab === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Trader Profile Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pro Trader', 'Individual', 'Institutional'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border text-center transition ${
                      role === r
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remember me checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'signin' ? 'Sign In to Scanner' : 'Create Trader Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Session</span>
          </span>
          <span className="font-mono text-zinc-500">
            Minervini SEPA v2.4
          </span>
        </div>

      </div>
    </div>
  );
};
