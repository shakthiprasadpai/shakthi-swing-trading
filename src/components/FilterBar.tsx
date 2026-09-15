import React, { useState } from 'react';
import { 
  Search, Filter, SlidersHorizontal, Activity, ArrowUpDown, 
  Star, Zap, AlertTriangle, Layers, Download, ChevronDown, Sparkles 
} from 'lucide-react';
import { ScannerFilterState, Market, VCPStage } from '../types';

interface FilterBarProps {
  filters: ScannerFilterState;
  onFilterChange: (newFilters: ScannerFilterState) => void;
  resultCount: number;
  watchlistCount?: number;
  anomalyCount?: number;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
  onOpenSectorPerformance?: () => void;
  onExportCsv?: () => void;
  onExportWatchlistCsv?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  resultCount,
  watchlistCount = 0,
  anomalyCount = 0,
  isLoggedIn = false,
  onRequireLogin,
  onOpenSectorPerformance,
  onExportCsv,
  onExportWatchlistCsv,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleMarketChange = (market: Market) => {
    onFilterChange({ ...filters, market });
  };

  const toggleStage = (stage: VCPStage) => {
    const exists = filters.stages.includes(stage);
    let newStages: VCPStage[];
    if (exists) {
      newStages = filters.stages.filter(s => s !== stage);
      if (newStages.length === 0) newStages = ['CONFIRMED_BREAKOUT', 'PIVOT_ALERT', 'TIGHTENING', 'FORMING'];
    } else {
      newStages = [...filters.stages, stage];
    }
    onFilterChange({ ...filters, stages: newStages });
  };

  const isSmartSortActive = filters.sortBy === 'SMART_RANK';

  const toggleSmartSort = () => {
    onFilterChange({
      ...filters,
      sortBy: isSmartSortActive ? 'RS_RATING' : 'SMART_RANK'
    });
  };

  return (
    <div className="bg-zinc-900/60 border-b border-zinc-800 p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Row 1: Search, Market Selector, Smart Sort Toggle, Sort By, Sector View & CSV Export */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Market Tab Selector */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => handleMarketChange('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filters.market === 'ALL'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Universes
            </button>
            <button
              onClick={() => handleMarketChange('NIFTY')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filters.market === 'NIFTY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>NSE Nifty Universe</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-md font-mono">India</span>
            </button>
            <button
              onClick={() => handleMarketChange('US')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filters.market === 'US'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>US Growth Leaders</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-md font-mono">US</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker, sector, or company..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/60 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 outline-none transition"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Action Tools: Smart Sort, Sector View, Export CSV */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            
            {/* ⚡ Smart Sorting Toggle Button */}
            <button
              onClick={toggleSmartSort}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                isSmartSortActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300'
              }`}
              title="Toggle Minervini Smart Alpha multi-factor ranking (Trend + RS + Pivot + Vol + ADX)"
            >
              <Zap className={`w-3.5 h-3.5 ${isSmartSortActive ? 'fill-white' : 'text-amber-400'}`} />
              <span>Smart Sort</span>
              {isSmartSortActive && (
                <span className="text-[10px] bg-emerald-700/80 px-1 py-0.2 rounded font-mono">ON</span>
              )}
            </button>

            {/* Sector Performance View Trigger */}
            {onOpenSectorPerformance && (
              <button
                onClick={onOpenSectorPerformance}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl font-medium transition flex items-center gap-1.5"
                title="Open Top-Down Sector Rotation & Performance Dashboard"
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Sector View</span>
              </button>
            )}

            {/* Export CSV Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl font-medium transition flex items-center gap-1.5"
                title="Export screened universe or watchlist to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {isExportOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 z-40 text-xs animate-in fade-in duration-150"
                  onClick={() => setIsExportOpen(false)}
                >
                  <button
                    onClick={() => onExportCsv?.()}
                    className="w-full px-3.5 py-2 text-left text-zinc-200 hover:bg-zinc-900 hover:text-emerald-300 transition flex items-center justify-between"
                  >
                    <span>Export Screened List ({resultCount})</span>
                    <span className="text-[10px] text-zinc-500 font-mono">.csv</span>
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={() => onExportWatchlistCsv?.()}
                      className="w-full px-3.5 py-2 text-left text-zinc-200 hover:bg-zinc-900 hover:text-amber-300 transition flex items-center justify-between border-t border-zinc-900"
                    >
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Export My Watchlist ({watchlistCount})</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">.csv</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Standard Sort Select Controller */}
            <div className="flex items-center gap-1.5 text-xs bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                className="bg-transparent text-zinc-300 text-xs outline-none cursor-pointer"
              >
                <option value="SMART_RANK" className="bg-zinc-950">⚡ Smart Alpha Rank</option>
                <option value="RS_RATING" className="bg-zinc-950">RS Rating (0-99)</option>
                <option value="ADX" className="bg-zinc-950">ADX Trend (&gt;25)</option>
                <option value="VOLUME_SURGE" className="bg-zinc-950">Volume Surge Ratio</option>
                <option value="RSI" className="bg-zinc-950">RSI Momentum (14)</option>
                <option value="PCT_TO_PIVOT" className="bg-zinc-950">% to Pivot Gate</option>
                <option value="CHANGE_PCT" className="bg-zinc-950">Today's % Change</option>
                <option value="SCORE" className="bg-zinc-950">Minervini Score (8/8)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Selected Sector Filter Chip (if active) */}
        {filters.selectedSector && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-zinc-500">Filtered by Sector:</span>
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium flex items-center gap-1.5">
              <span>{filters.selectedSector}</span>
              <button
                onClick={() => onFilterChange({ ...filters, selectedSector: undefined })}
                className="text-emerald-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <button
              onClick={() => onFilterChange({ ...filters, selectedSector: undefined })}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
            >
              Clear Sector
            </button>
          </div>
        )}

        {/* Row 2: Parameters Strip - VCP Stage, Relative Strength, RSI controls, Volume Anomalies */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          
          {/* VCP Stage Filters */}
          <div className="flex items-center gap-1 mr-1">
            <span className="text-zinc-500 text-[11px] uppercase font-semibold">Stage:</span>
            <button
              onClick={() => toggleStage('CONFIRMED_BREAKOUT')}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium transition ${
                filters.stages.includes('CONFIRMED_BREAKOUT')
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🚀 Breakout
            </button>
            <button
              onClick={() => toggleStage('PIVOT_ALERT')}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium transition ${
                filters.stages.includes('PIVOT_ALERT')
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              ⚡ Pivot Gate
            </button>
            <button
              onClick={() => toggleStage('TIGHTENING')}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium transition ${
                filters.stages.includes('TIGHTENING')
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🎯 Tightening
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>

          {/* Minervini Trend Score */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] uppercase font-semibold">Minervini:</span>
            <select
              value={filters.minScore}
              onChange={(e) => onFilterChange({ ...filters, minScore: Number(e.target.value) })}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-md px-2 py-1 text-xs outline-none focus:border-emerald-500"
            >
              <option value={8}>8/8 Criteria (Strict)</option>
              <option value={7}>≥ 7/8 Criteria</option>
              <option value={6}>≥ 6/8 Criteria</option>
            </select>
          </div>

          {/* RS Rating Threshold */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] uppercase font-semibold">Min RS:</span>
            <select
              value={filters.minRSRating}
              onChange={(e) => onFilterChange({ ...filters, minRSRating: Number(e.target.value) })}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-md px-2 py-1 text-xs outline-none focus:border-emerald-500"
            >
              <option value={0}>Any RS</option>
              <option value={70}>RS ≥ 70 (Minervini Base)</option>
              <option value={80}>RS ≥ 80 (Leader)</option>
              <option value={90}>RS ≥ 90 (Super Leader)</option>
            </select>
          </div>

          {/* Relative Strength Index (RSI 14) Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] uppercase font-semibold">RSI (14):</span>
            <select
              value={filters.minRsiValue || 0}
              onChange={(e) => onFilterChange({ ...filters, minRsiValue: Number(e.target.value) })}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-md px-2 py-1 text-xs outline-none focus:border-emerald-500"
            >
              <option value={0}>Any RSI</option>
              <option value={55}>RSI ≥ 55 (Bullish)</option>
              <option value={60}>RSI ≥ 60 (Expansion)</option>
              <option value={65}>RSI ≥ 65 (Super Momentum)</option>
              <option value={70}>RSI ≥ 70 (Power Trend)</option>
            </select>
          </div>

          {/* RSI to Benchmark Spread */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] uppercase font-semibold">RSI Spread:</span>
            <select
              value={filters.minRsiSpread}
              onChange={(e) => onFilterChange({ ...filters, minRsiSpread: Number(e.target.value) })}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-md px-2 py-1 text-xs outline-none focus:border-emerald-500"
            >
              <option value={-99}>Any Spread</option>
              <option value={0}>RSI &gt; Index RSI</option>
              <option value={5}>RSI +5 &gt; Index</option>
              <option value={10}>RSI +10 &gt; Index</option>
            </select>
          </div>

          {/* ADX Trend Confirmation */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] uppercase font-semibold">ADX:</span>
            <select
              value={filters.minADX}
              onChange={(e) => onFilterChange({ ...filters, minADX: Number(e.target.value) })}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-md px-2 py-1 text-xs outline-none focus:border-emerald-500"
            >
              <option value={0}>Any ADX</option>
              <option value={20}>ADX ≥ 20</option>
              <option value={25}>ADX ≥ 25 (Strong)</option>
              <option value={30}>ADX ≥ 30 (Powerful)</option>
            </select>
          </div>

          {/* 🚨 Volume Anomaly Alert Toggle */}
          <button
            onClick={() => onFilterChange({ ...filters, onlyVolumeAnomaly: !filters.onlyVolumeAnomaly })}
            className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition flex items-center gap-1.5 ${
              filters.onlyVolumeAnomaly
                ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-amber-300 hover:border-amber-500/40'
            }`}
            title="Filter to stocks with extreme institutional accumulation (>2x 50D SMA) or supply dry-up (<0.65x at pivot)"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Volume Anomaly</span>
            {anomalyCount > 0 && (
              <span className="bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded font-mono text-[10px]">
                {anomalyCount}
              </span>
            )}
          </button>

          {/* User Watchlist Quick Filter */}
          <button
            onClick={() => {
              if (!isLoggedIn) {
                onRequireLogin?.();
                return;
              }
              onFilterChange({ ...filters, onlyWatchlist: !filters.onlyWatchlist });
            }}
            className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition flex items-center gap-1.5 ${
              filters.onlyWatchlist
                ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 shadow-sm ring-1 ring-amber-500/20'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={isLoggedIn ? 'Filter scanner to only your saved watchlist stocks' : 'Sign in to save and filter by personal watchlist'}
          >
            <Star className={`w-3 h-3 ${filters.onlyWatchlist ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
            <span>My Watchlist</span>
            {isLoggedIn && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Result count pill */}
          <div className="ml-auto text-xs text-zinc-400 font-mono">
            Showing <span className="text-emerald-400 font-bold">{resultCount}</span> setups
          </div>

        </div>

      </div>
    </div>
  );
};

