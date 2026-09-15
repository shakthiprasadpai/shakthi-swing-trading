import React from 'react';
import { TrendingUp, Mail, BookOpen, RefreshCw, BarChart2, ShieldCheck, Zap } from 'lucide-react';
import { BenchmarkMetrics, BenchmarkIndex, UserProfile } from '../types';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  niftyBenchmark: BenchmarkMetrics;
  spBenchmark: BenchmarkMetrics;
  selectedBenchmark: BenchmarkIndex;
  onSelectBenchmark: (bench: BenchmarkIndex) => void;
  onOpenGuide: () => void;
  onOpenGmailDigest: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  breakoutCount: number;
  totalScanned: number;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onToggleWatchlistFilter: () => void;
  isWatchlistFiltered: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  niftyBenchmark,
  spBenchmark,
  selectedBenchmark,
  onSelectBenchmark,
  onOpenGuide,
  onOpenGmailDigest,
  onRefresh,
  isRefreshing,
  breakoutCount,
  totalScanned,
  currentUser,
  onOpenLogin,
  onLogout,
  onToggleWatchlistFilter,
  isWatchlistFiltered,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Strategy Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
                  Minervini Trend Trading Scanner
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full">
                  SEPA & VCP Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                High-Momentum Breakouts • Volatility Contraction • Relative Strength & RSI vs Nifty
              </p>
            </div>
          </div>

          {/* Market Benchmark Tickers & RS Index Selector */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* NIFTY 50 Benchmark Pill */}
            <button
              onClick={() => onSelectBenchmark('NIFTY_50')}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-left transition-all ${
                selectedBenchmark === 'NIFTY_50'
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-300">NIFTY 50</span>
                  {selectedBenchmark === 'NIFTY_50' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-zinc-200">₹{niftyBenchmark.currentPrice.toLocaleString('en-IN')}</span>
                  <span className={`font-mono text-[11px] ${niftyBenchmark.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    +{niftyBenchmark.changePercent}%
                  </span>
                </div>
              </div>
              <div className="border-l border-zinc-800 pl-2 text-right">
                <span className="text-[10px] text-zinc-500 block uppercase">Nifty RSI</span>
                <span className="font-mono text-xs text-teal-300 font-semibold">{niftyBenchmark.rsi14}</span>
              </div>
            </button>

            {/* S&P 500 Benchmark Pill */}
            <button
              onClick={() => onSelectBenchmark('SP_500')}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-left transition-all ${
                selectedBenchmark === 'SP_500'
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-300">S&P 500</span>
                  {selectedBenchmark === 'SP_500' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-zinc-200">${spBenchmark.currentPrice.toLocaleString('en-US')}</span>
                  <span className={`font-mono text-[11px] ${spBenchmark.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    +{spBenchmark.changePercent}%
                  </span>
                </div>
              </div>
              <div className="border-l border-zinc-800 pl-2 text-right">
                <span className="text-[10px] text-zinc-500 block uppercase">SPX RSI</span>
                <span className="font-mono text-xs text-teal-300 font-semibold">{spBenchmark.rsi14}</span>
              </div>
            </button>

            {/* Header Actions */}
            <div className="flex items-center gap-2 ml-auto md:ml-0">
              {/* VCP Strategy Guide */}
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
                title="Minervini 8-Point Trend Template & VCP Guide"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Strategy Rules</span>
              </button>

              {/* Gmail Digest Alerts */}
              <button
                onClick={onOpenGmailDigest}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-lg transition shadow-sm"
                title="Send Breakout Alert Digest to Gmail"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gmail Alert</span>
                <span className="bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold rounded-full">
                  {breakoutCount}
                </span>
              </button>

              {/* Refresh Scanner */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition disabled:opacity-50"
                title="Rescan universe"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              {/* User Account / Login & Logout Menu */}
              <div className="pl-1 border-l border-zinc-800">
                <UserMenu
                  currentUser={currentUser}
                  onOpenLogin={onOpenLogin}
                  onLogout={onLogout}
                  onToggleWatchlistFilter={onToggleWatchlistFilter}
                  isWatchlistFiltered={isWatchlistFiltered}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Quick Stats strip */}
        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scanned: <strong className="text-zinc-200">{totalScanned}</strong> stocks</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Breakout / Pivot Zone: <strong className="text-amber-300">{breakoutCount}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Benchmark RS Base: <strong className="text-sky-300">{selectedBenchmark === 'NIFTY_50' ? 'NIFTY 50' : 'S&P 500'}</strong></span>
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Trend Template: 8/8 Criteria • Volume Spike &gt;1.5x • ATR Volatility Compression
          </div>
        </div>

      </div>
    </header>
  );
};
