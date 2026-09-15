import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  User, LogIn, LogOut, ChevronDown, Bookmark, 
  Mail, Shield, Sparkles, Check, BellRing, Settings 
} from 'lucide-react';

interface UserMenuProps {
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onToggleWatchlistFilter: () => void;
  isWatchlistFiltered: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onToggleWatchlistFilter,
  isWatchlistFiltered,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When logged out
  if (!currentUser) {
    return (
      <button
        onClick={onOpenLogin}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition shadow-sm"
        title="Sign in to save watchlist and receive personalized Gmail alerts"
      >
        <LogIn className="w-3.5 h-3.5 text-emerald-400" />
        <span>Log In</span>
      </button>
    );
  }

  // Initials for avatar
  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 rounded-lg transition"
        title={`${currentUser.name} (${currentUser.role})`}
      >
        <div className="relative">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-emerald-500/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center border border-emerald-500/40 font-mono">
              {initials}
            </div>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-zinc-950" />
        </div>

        <div className="flex flex-col text-left leading-tight hidden sm:flex">
          <span className="text-xs font-bold text-zinc-200 truncate max-w-[110px]">
            {currentUser.name}
          </span>
          <span className="text-[9px] font-mono text-emerald-400 font-medium">
            {currentUser.role}
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* User Profile Header */}
          <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/40 font-mono">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-100 truncate">
                    {currentUser.name}
                  </h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Menu Options */}
          <div className="p-2 space-y-1 text-xs">
            
            {/* Watchlist Filter Shortcut */}
            <button
              onClick={() => {
                onToggleWatchlistFilter();
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                isWatchlistFiltered 
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bookmark className={`w-4 h-4 ${isWatchlistFiltered ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
                <span>My Starred Watchlist</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                {currentUser.savedWatchlist.length}
              </span>
            </button>

            {/* Gmail Alerts Status */}
            <div className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60 text-zinc-300">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Alert Destination</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-300 truncate mt-0.5">
                {currentUser.email}
              </div>
            </div>

            {/* Account Info */}
            <div className="px-3 py-1.5 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
              <span>Member Since</span>
              <span className="text-zinc-400">{currentUser.joinedDate}</span>
            </div>

          </div>

          {/* Log Out Action */}
          <div className="p-2 border-t border-zinc-800 bg-zinc-900/30">
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">End Session</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
