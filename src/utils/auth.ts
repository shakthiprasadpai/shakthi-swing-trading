import { UserProfile } from '../types';

const STORAGE_KEY = 'minervini_trader_session';

export const DEFAULT_USER: UserProfile = {
  id: 'usr_shakthi_01',
  name: 'Shakthi Prasad',
  email: 'shakthiprasadp070@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  role: 'Pro Trader',
  joinedDate: 'Jan 2024',
  lastLogin: 'Today, 09:30 AM',
  savedWatchlist: ['TRENT.NS', 'NVDA', 'DIXON.NS', 'PLTR'],
  alertPreferences: {
    emailAlerts: true,
    minScoreAlert: 7,
    minAdxAlert: 25,
    frequency: 'daily_digest',
  },
};

export const DEMO_PROFILES: UserProfile[] = [
  DEFAULT_USER,
  {
    id: 'usr_hedge_02',
    name: 'Alexander Cross',
    email: 'across.capital@hedgefund.com',
    role: 'Institutional',
    joinedDate: 'Nov 2023',
    lastLogin: 'Yesterday',
    savedWatchlist: ['NVDA', 'META', 'HAL.NS', 'ANET'],
    alertPreferences: {
      emailAlerts: true,
      minScoreAlert: 8,
      minAdxAlert: 28,
      frequency: 'realtime',
    },
  },
];

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default to logged-in user with shakthiprasadp070@gmail.com for seamless out-of-the-box experience
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    if (raw === 'GUEST') {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function setStoredUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.setItem(STORAGE_KEY, 'GUEST');
    }
  } catch (err) {
    console.error('Failed to update stored user session', err);
  }
}

export function toggleStockBookmark(user: UserProfile, symbol: string): UserProfile {
  const exists = user.savedWatchlist.includes(symbol);
  const updatedWatchlist = exists
    ? user.savedWatchlist.filter(s => s !== symbol)
    : [...user.savedWatchlist, symbol];

  const updatedUser: UserProfile = {
    ...user,
    savedWatchlist: updatedWatchlist,
  };

  setStoredUser(updatedUser);
  return updatedUser;
}
