import React, { useState, useMemo } from 'react';
import { X, Layers, TrendingUp, Sparkles, Filter, ChevronRight, BarChart3, ArrowUpRight, Flame } from 'lucide-react';
import { StockData, BenchmarkIndex, SectorPerformance } from '../types';
import { calculateSectorPerformance } from '../utils/technicalCalculations';

interface SectorPerformanceModalProps {
  stocks: StockData[];
  benchmark: BenchmarkIndex;
  onClose: () => void;
  onSelectSector: (sectorName: string) => void;
}

export const SectorPerformanceModal: React.FC<SectorPerformanceModalProps> = ({
  stocks,
  benchmark,
  onClose,
  onSelectSector,
}) => {
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'NIFTY' | 'US'>('ALL');
  const isNifty = benchmark === 'NIFTY_50';
  const benchName = isNifty ? 'NIFTY 50' : 'S&P 500';

  const marketFilteredStocks = useMemo(() => {
    if (selectedMarket === 'ALL') return stocks;
    return stocks.filter(s => s.market === selectedMarket);
  }, [stocks, selectedMarket]);

  const sectorPerformances = useMemo(() => {
    return calculateSectorPerformance(marketFilteredStocks, benchmark);
  }, [marketFilteredStocks, benchmark]);

  const topSector = sectorPerformances[0];
  const totalBreakouts = sectorPerformances.reduce((acc, s) => acc + s.breakoutCount, 0);

  const getRankBadge = (rank: SectorPerformance['momentumRank']) => {
    switch (rank) {
      case 'LEADING':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'Leading Sector',
        };
      case 'IMPROVING':
        return {
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          dot: 'bg-sky-400',
          label: 'Improving',
        };
      case 'NEUTRAL':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          label: 'Neutral',
        };
      case 'LAGGING':
      default:
        return {
          badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          dot: 'bg-zinc-500',
          label: 'Lagging',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                  Sector Performance & Momentum Rotation
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  Top-Down SEPA
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Institutional leader concentration & relative strength rotation vs {benchName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Market Filter Tabs & Summary Row */}
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Market selector tabs */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setSelectedMarket('ALL')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                selectedMarket === 'ALL'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Sectors
            </button>
            <button
              onClick={() => setSelectedMarket('NIFTY')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                selectedMarket === 'NIFTY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              NSE India
            </button>
            <button
              onClick={() => setSelectedMarket('US')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                selectedMarket === 'US'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              US Markets
            </button>
          </div>

          {/* Key Takeaways */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {topSector && (
              <span className="text-zinc-400">
                Top Sector: <strong className="text-emerald-400">{topSector.sector}</strong> ({topSector.avgRSRating} RS)
              </span>
            )}
            <span className="text-zinc-400">
              Breakouts: <strong className="text-amber-300">{totalBreakouts} setups</strong>
            </span>
          </div>
        </div>

        {/* Body content - Sector list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sectorPerformances.map((sec, idx) => {
              const rankInfo = getRankBadge(sec.momentumRank);

              return (
                <div
                  key={sec.sector}
                  className="p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-emerald-500/40 transition group flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center justify-center font-bold">
                            #{idx + 1}
                          </span>
                          <h3 className="font-semibold text-zinc-100 text-sm group-hover:text-emerald-300 transition">
                            {sec.sector}
                          </h3>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          {sec.stockCount} tracked stocks • {sec.breakoutCount} in breakout / pivot gate
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1.5 ${rankInfo.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rankInfo.dot}`} />
                        {rankInfo.label}
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-zinc-800/80 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-sans">Avg RS</span>
                        <span className="font-bold text-amber-400">{sec.avgRSRating}/99</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-sans">3M Alpha</span>
                        <span className={`font-bold ${sec.avgAlpha3M >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sec.avgAlpha3M >= 0 ? '+' : ''}{sec.avgAlpha3M}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-sans">Avg RSI</span>
                        <span className="font-bold text-sky-400">{sec.avgRsi}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-sans">Today %</span>
                        <span className={`font-bold ${sec.avgChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sec.avgChangePercent >= 0 ? '+' : ''}{sec.avgChangePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Relative Strength Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Relative Strength vs {benchName}</span>
                        <span className="font-mono">{sec.avgRSRating}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            sec.avgRSRating >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                            sec.avgRSRating >= 70 ? 'bg-sky-400' : 'bg-amber-500'
                          }`}
                          style={{ width: `${sec.avgRSRating}%` }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Footer with top stock & action */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <span className="text-[11px]">Leader:</span>
                      <span className="font-mono font-bold text-zinc-200">{sec.topStockSymbol}</span>
                      <span className={`text-[10px] ${sec.topStockGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({sec.topStockGain >= 0 ? '+' : ''}{sec.topStockGain.toFixed(2)}%)
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectSector(sec.sector);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 font-medium transition text-[11px] flex items-center gap-1"
                    >
                      <span>Filter Scanner</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Minervini Strategy Rule Card */}
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/15 text-xs text-zinc-300 flex items-start gap-3 mt-4">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-emerald-300 font-semibold block">Mark Minervini SEPA Principle on Sector Rotation:</strong>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                "Studies show that approximately 50% of a stock's explosive price move is directly tied to the strength of its overall sector and industry group. Never fight the sector tide: always concentrate capital in the top 2 to 3 leading sectors showing RS Ratings above 80."
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
          <span className="font-mono text-[11px]">
            Showing {sectorPerformances.length} market sectors
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
          >
            Close View
          </button>
        </div>

      </div>
    </div>
  );
};
