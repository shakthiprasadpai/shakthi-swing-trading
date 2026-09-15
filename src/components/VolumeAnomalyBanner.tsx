import React, { useState } from 'react';
import { AlertTriangle, Flame, Droplets, ArrowRight, ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { StockData } from '../types';

interface VolumeAnomalyBannerProps {
  stocks: StockData[];
  onSelectStock: (stock: StockData) => void;
  isFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
}

export const VolumeAnomalyBanner: React.FC<VolumeAnomalyBannerProps> = ({
  stocks,
  onSelectStock,
  isFilterActive,
  onToggleAnomalyFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Filter stocks that have detected volume anomalies
  const anomalyStocks = stocks.filter(s => s.volumeAnomaly != null);

  if (isDismissed || anomalyStocks.length === 0) return null;

  const accumulationCount = anomalyStocks.filter(s => s.volumeAnomaly?.type === 'ACCUMULATION_SPIKE').length;
  const dryUpCount = anomalyStocks.filter(s => s.volumeAnomaly?.type === 'VOLUME_DRYUP').length;

  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900/70 to-teal-950/40 border-y border-amber-500/30 px-4 py-2.5 transition animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        
        {/* Banner summary bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-200 uppercase tracking-wide text-[11px]">
                Volume Anomalies Detected:
              </span>
              <span className="text-amber-300 font-semibold font-mono">
                {anomalyStocks.length} setups
              </span>
              <span className="text-zinc-500 hidden sm:inline">•</span>
              <span className="text-emerald-400 font-mono hidden sm:inline">
                {accumulationCount} Heavy Accumulation (2x+ 50D SMA)
              </span>
              {dryUpCount > 0 && (
                <>
                  <span className="text-zinc-500 hidden sm:inline">•</span>
                  <span className="text-sky-400 font-mono hidden sm:inline">
                    {dryUpCount} Supply Dry-Up at Pivot
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Filter toggle */}
            <button
              onClick={onToggleAnomalyFilter}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1.5 border ${
                isFilterActive
                  ? 'bg-amber-500/30 border-amber-500/60 text-amber-200 shadow-sm'
                  : 'bg-zinc-900/90 border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{isFilterActive ? 'Showing Anomalies Only' : 'Filter Scanner to Anomalies'}</span>
            </button>

            {/* Expand / Collapse Details */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              title={isExpanded ? 'Collapse' : 'Expand detailed setups'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Dismiss */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 transition"
              title="Dismiss volume anomaly banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Detailed Anomaly Cards (Shown when expanded) */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-800/80 mt-1">
            {anomalyStocks.map((stock) => {
              const isSpike = stock.volumeAnomaly?.type === 'ACCUMULATION_SPIKE';

              return (
                <div
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex flex-col justify-between ${
                    isSpike
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/40'
                      : 'bg-sky-950/20 border-sky-500/30 hover:bg-sky-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono">
                      <strong className="text-zinc-100">{stock.symbol}</strong>
                      <span className="text-[10px] text-zinc-400">({stock.exchange})</span>
                    </div>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase flex items-center gap-1 ${
                      isSpike ? 'text-emerald-300 bg-emerald-500/20' : 'text-sky-300 bg-sky-500/20'
                    }`}>
                      {isSpike ? <Flame className="w-2.5 h-2.5" /> : <Droplets className="w-2.5 h-2.5" />}
                      {isSpike ? `${stock.volumeSurgeRatio.toFixed(1)}x Vol` : 'Dry-Up'}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 truncate mt-1">{stock.name}</p>
                  
                  <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-400">Stage: {stock.vcpStage.replace('_', ' ')}</span>
                    <span className="text-emerald-400 flex items-center gap-0.5 group-hover:underline">
                      Inspect Chart <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
