import React, { useState, useMemo, useEffect } from 'react';
import { 
  INITIAL_STOCKS, 
  NIFTY_50_BENCHMARK, 
  SP500_BENCHMARK 
} from './data/stocksData';
import { 
  StockData, 
  ScannerFilterState, 
  BenchmarkIndex, 
  BenchmarkMetrics,
  UserProfile 
} from './types';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { StockTable } from './components/StockTable';
import { StockDetailModal } from './components/StockDetailModal';
import { GmailAlertModal } from './components/GmailAlertModal';
import { GmailBatchDigestModal } from './components/GmailBatchDigestModal';
import { VCPGuideModal } from './components/VCPGuideModal';
import { AuthModal } from './components/AuthModal';
import { SectorPerformanceModal } from './components/SectorPerformanceModal';
import { VolumeAnomalyBanner } from './components/VolumeAnomalyBanner';
import { getStoredUser, setStoredUser, toggleStockBookmark } from './utils/auth';
import { signOutGoogle } from './utils/googleAuth';
import { testFirestoreConnection, syncUserProfileToFirestore } from './utils/firebase';
import { exportStocksToCsv } from './utils/csvExport';
import { formatCurrency, getStageBadge } from './utils/technicalCalculations';
import { 
  Flame, TrendingUp, Zap, ShieldAlert, Sparkles, 
  Activity, ArrowUpRight, BarChart2, Layers, CheckCircle2, Star, Check, LogOut, User 
} from 'lucide-react';

export default function App() {
  // Application Data State
  const [stocks, setStocks] = useState<StockData[]>(INITIAL_STOCKS);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkIndex>('NIFTY_50');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals & Selected Stock
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [alertStock, setAlertStock] = useState<StockData | null>(null);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Test connection to Firestore on initial boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Login handler
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    syncUserProfileToFirestore(user).catch(() => {});
    showToast(`Welcome back, ${user.name}! Session active.`);
  };

  // Logout handler
  const handleLogout = () => {
    signOutGoogle().catch(() => {});
    setStoredUser(null);
    setCurrentUser(null);
    setFilters(prev => ({ ...prev, onlyWatchlist: false }));
    showToast('Logged out successfully. Switched to Guest mode.');
  };

  // Watchlist bookmark toggle
  const handleToggleBookmark = (symbol: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const isBookmarked = currentUser.savedWatchlist.includes(symbol);
    const updated = toggleStockBookmark(currentUser, symbol);
    setCurrentUser(updated);
    syncUserProfileToFirestore(updated).catch(() => {});
    showToast(isBookmarked ? `Removed ${symbol} from watchlist` : `Saved ${symbol} to personal watchlist ⭐`);
  };

  // Filter State
  const [filters, setFilters] = useState<ScannerFilterState>({
    market: 'ALL',
    stages: ['CONFIRMED_BREAKOUT', 'PIVOT_ALERT', 'TIGHTENING', 'FORMING'],
    minScore: 7,
    minRSRating: 70,
    minADX: 0,
    minVolumeSurge: 0,
    onlyVolumeBreakout: false,
    onlyVolumeAnomaly: false,
    rsiZone: 'ALL',
    minRsiValue: 0,
    minRsiSpread: -99,
    maxATRPercent: 0,
    searchQuery: '',
    sortBy: 'SMART_RANK',
    onlyWatchlist: false,
    selectedSector: undefined,
  });

  const currentBenchmark: BenchmarkMetrics = 
    selectedBenchmark === 'NIFTY_50' ? NIFTY_50_BENCHMARK : SP500_BENCHMARK;

  // Filter and Sort Engine
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      // User Saved Watchlist filter
      if (filters.onlyWatchlist) {
        if (!currentUser || !currentUser.savedWatchlist.includes(stock.symbol)) {
          return false;
        }
      }

      // Selected Sector filter
      if (filters.selectedSector && stock.sector !== filters.selectedSector) {
        return false;
      }

      // Volume Anomaly filter (Spike or Dry-Up)
      if (filters.onlyVolumeAnomaly && !stock.volumeAnomaly) {
        return false;
      }

      // Market filter
      if (filters.market !== 'ALL' && stock.market !== filters.market) {
        return false;
      }

      // VCP Stage filter
      if (!filters.stages.includes(stock.vcpStage)) {
        return false;
      }

      // Minervini Score filter
      if (stock.checklist.score < filters.minScore) {
        return false;
      }

      // RS Rating filter
      if (stock.rsRating < filters.minRSRating) {
        return false;
      }

      // ADX Trend Filter (Trend Strength confirmation > threshold, e.g. 25)
      if (filters.minADX > 0 && stock.adx14 < filters.minADX) {
        return false;
      }

      // Relative Strength Index (RSI 14) Level Filter
      if (filters.minRsiValue && filters.minRsiValue > 0 && stock.rsi14 < filters.minRsiValue) {
        return false;
      }

      // Volume Surge Filter (Relative to 50-day moving average)
      if (filters.minVolumeSurge > 0 && stock.volumeSurgeRatio < filters.minVolumeSurge) {
        return false;
      }

      // Breakout accompanied by significant increase in trading volume (volume > 50-day SMA)
      if (filters.onlyVolumeBreakout) {
        if (!stock.volumeAbove50SMA || stock.volumeSurgeRatio < 1.3) {
          return false;
        }
      }

      // RSI to Benchmark spread filter
      const spread = selectedBenchmark === 'NIFTY_50' 
        ? stock.rsiToNiftySpread 
        : stock.rsiToSP500Spread;
      if (spread < filters.minRsiSpread) {
        return false;
      }

      // ATR Volatility filter
      if (filters.maxATRPercent > 0 && stock.atrPercent > filters.maxATRPercent) {
        return false;
      }

      // Search Query filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchSymbol = stock.symbol.toLowerCase().includes(query);
        const matchName = stock.name.toLowerCase().includes(query);
        const matchSector = stock.sector.toLowerCase().includes(query);
        if (!matchSymbol && !matchName && !matchSector) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'SMART_RANK':
          return (b.smartRankScore ?? 0) - (a.smartRankScore ?? 0);
        case 'RS_RATING':
          return b.rsRating - a.rsRating;
        case 'ADX':
          return b.adx14 - a.adx14;
        case 'VOLUME_SURGE':
          return b.volumeSurgeRatio - a.volumeSurgeRatio;
        case 'RSI':
          return b.rsi14 - a.rsi14;
        case 'PCT_TO_PIVOT':
          return Math.abs(a.pctToPivot) - Math.abs(b.pctToPivot);
        case 'CHANGE_PCT':
          return b.changePercent - a.changePercent;
        case 'SCORE':
          return b.checklist.score - a.checklist.score;
        default:
          return 0;
      }
    });
  }, [stocks, filters, selectedBenchmark, currentUser]);

  // Counts of high-probability setups & volume anomalies
  const breakoutStocks = useMemo(() => {
    return stocks.filter(s => s.vcpStage === 'CONFIRMED_BREAKOUT' || s.vcpStage === 'PIVOT_ALERT');
  }, [stocks]);

  const anomalyStocks = useMemo(() => {
    return stocks.filter(s => s.volumeAnomaly != null);
  }, [stocks]);

  // CSV Export Handlers
  const handleExportFilteredCsv = () => {
    const result = exportStocksToCsv(filteredStocks, selectedBenchmark, 'minervini_screened_setups');
    if (result.success) {
      showToast(`Exported ${result.count} stocks to ${result.filename} 📥`);
    } else {
      showToast('No stocks currently matched to export.');
    }
  };

  const handleExportWatchlistCsv = () => {
    if (!currentUser || currentUser.savedWatchlist.length === 0) {
      showToast('Your watchlist is currently empty. Star stocks to add them.');
      return;
    }
    const watchlistStocks = stocks.filter(s => currentUser.savedWatchlist.includes(s.symbol));
    const result = exportStocksToCsv(watchlistStocks, selectedBenchmark, 'my_minervini_watchlist');
    if (result.success) {
      showToast(`Exported ${result.count} watchlist stocks to ${result.filename} ⭐`);
    }
  };

  // Refresh handler to simulate live market scanning
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStocks(prev => prev.map(s => {
        const delta = (Math.random() - 0.48) * 0.4;
        const newPrice = Number((s.currentPrice * (1 + delta / 100)).toFixed(2));
        const newChange = Number((s.changePercent + delta).toFixed(2));
        const newPctToPivot = Number((((newPrice - s.pivotPrice) / s.pivotPrice) * 100).toFixed(2));
        return {
          ...s,
          currentPrice: newPrice,
          changePercent: newChange,
          pctToPivot: newPctToPivot,
        };
      }));
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* App Header with Benchmark Tickers */}
      <Header
        niftyBenchmark={NIFTY_50_BENCHMARK}
        spBenchmark={SP500_BENCHMARK}
        selectedBenchmark={selectedBenchmark}
        onSelectBenchmark={setSelectedBenchmark}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenGmailDigest={() => setIsDigestOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        breakoutCount={breakoutStocks.length}
        totalScanned={stocks.length}
        currentUser={currentUser}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onToggleWatchlistFilter={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          setFilters(f => ({ ...f, onlyWatchlist: !f.onlyWatchlist }));
        }}
        isWatchlistFiltered={!!filters.onlyWatchlist}
      />

      {/* Main Filter & Parameters Controller */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        resultCount={filteredStocks.length}
        watchlistCount={currentUser?.savedWatchlist.length || 0}
        anomalyCount={anomalyStocks.length}
        isLoggedIn={!!currentUser}
        onRequireLogin={() => setIsAuthModalOpen(true)}
        onOpenSectorPerformance={() => setIsSectorModalOpen(true)}
        onExportCsv={handleExportFilteredCsv}
        onExportWatchlistCsv={handleExportWatchlistCsv}
      />

      {/* Volume Anomaly Alert Banner (Institutional Accumulation & Dry-Up Detection) */}
      <VolumeAnomalyBanner
        stocks={stocks}
        onSelectStock={(stock) => setSelectedStock(stock)}
        isFilterActive={!!filters.onlyVolumeAnomaly}
        onToggleAnomalyFilter={() => setFilters(prev => ({ ...prev, onlyVolumeAnomaly: !prev.onlyVolumeAnomaly }))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 space-y-5">
        
        {/* Top Breakout High-Probability Spotlight Strip */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Active Breakout & Pivot Gate Setups
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Meeting 8/8 Trend Template & Volume Surge &gt;1.5x
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {breakoutStocks.slice(0, 3).map((stock) => {
              const stageStyle = getStageBadge(stock.vcpStage);
              const isNifty = selectedBenchmark === 'NIFTY_50';
              const rsiSpread = isNifty ? stock.rsiToNiftySpread : stock.rsiToSP500Spread;
              const isBookmarked = currentUser?.savedWatchlist.includes(stock.symbol);

              return (
                <div
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-emerald-500/40 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleBookmark(stock.symbol, e)}
                          className={`p-1 rounded hover:bg-zinc-800 transition ${
                            isBookmarked
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                          title={isBookmarked ? 'Remove from personal watchlist' : 'Add to personal watchlist'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                        </button>
                        <span className="font-mono font-bold text-sm text-zinc-100 group-hover:text-emerald-400 transition">
                          {stock.symbol}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                          {stock.exchange}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${stageStyle.bg}`}>
                        {stageStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-1">{stock.name}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-3 pt-2.5 border-t border-zinc-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans">Price</span>
                      <span className="font-bold text-zinc-200">{formatCurrency(stock.currentPrice, stock.currency)}</span>
                      <span className={`text-[10px] block ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans">RS vs {isNifty ? 'NIFTY' : 'SPX'}</span>
                      <span className="font-bold text-amber-400">{stock.rsRating}/99</span>
                      <span className="text-[10px] text-emerald-400 block">
                        +{rsiSpread.toFixed(1)} RSI
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans">Volume Surge</span>
                      <span className="font-bold text-emerald-400">{stock.volumeSurgeRatio.toFixed(2)}x</span>
                      <span className="text-[10px] text-zinc-400 block font-sans">{stock.totalContractions}T VCP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px]">
                    <span className="text-zinc-400 font-mono">
                      Pivot: <strong className="text-emerald-300">{formatCurrency(stock.pivotPrice, stock.currency)}</strong>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAlertStock(stock);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 text-[11px]"
                    >
                      <span>Gmail Alert</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* The Master Scanner Table */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Minervini Volatility & Momentum Screener
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="hidden sm:inline">Click any row to inspect VCP chart and position size</span>
            </div>
          </div>

          <StockTable
            stocks={filteredStocks}
            selectedBenchmark={selectedBenchmark}
            selectedStockSymbol={selectedStock?.symbol || null}
            onSelectStock={(stock) => setSelectedStock(stock)}
            onOpenGmailAlert={(stock, e) => {
              e.stopPropagation();
              setAlertStock(stock);
            }}
            savedWatchlist={currentUser?.savedWatchlist || []}
            onToggleBookmark={handleToggleBookmark}
            sortBy={filters.sortBy}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-4 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Minervini SEPA & VCP Engine • Real-time Relative Strength vs NIFTY 50 & S&P 500</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Vol Contraction (VCP)</span>
            <span>•</span>
            <span>RSI Momentum Zone (60-80)</span>
            <span>•</span>
            <span>Gmail Breakout Alerts</span>
          </div>
        </div>
      </footer>

      {/* Top-Down Sector Performance & Momentum Rotation Modal */}
      {isSectorModalOpen && (
        <SectorPerformanceModal
          stocks={stocks}
          benchmark={selectedBenchmark}
          onClose={() => setIsSectorModalOpen(false)}
          onSelectSector={(sectorName) => {
            setFilters(prev => ({ ...prev, selectedSector: sectorName }));
            showToast(`Filtered universe to ${sectorName} sector`);
          }}
        />
      )}

      {/* Stock Technical Detail & Chart Audit Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          benchmark={currentBenchmark}
          benchmarkType={selectedBenchmark}
          onClose={() => setSelectedStock(null)}
          onOpenGmailAlert={(stock) => setAlertStock(stock)}
        />
      )}

      {/* Single Stock Gmail Alert Modal */}
      {alertStock && (
        <GmailAlertModal
          stock={alertStock}
          benchmarkType={selectedBenchmark}
          userEmail={currentUser?.email || "shakthiprasadp070@gmail.com"}
          onClose={() => setAlertStock(null)}
        />
      )}

      {/* Daily Batch Digest Gmail Modal */}
      {isDigestOpen && (
        <GmailBatchDigestModal
          stocks={filteredStocks}
          benchmark={currentBenchmark}
          benchmarkType={selectedBenchmark}
          userEmail={currentUser?.email || "shakthiprasadp070@gmail.com"}
          onClose={() => setIsDigestOpen(false)}
        />
      )}

      {/* Strategy Rules & VCP Educational Guide Modal */}
      {isGuideOpen && (
        <VCPGuideModal onClose={() => setIsGuideOpen(false)} />
      )}

      {/* Trader Auth Modal (Login / Sign Up / 1-Click Demo) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Dynamic Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="text-zinc-500 hover:text-zinc-300 ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
