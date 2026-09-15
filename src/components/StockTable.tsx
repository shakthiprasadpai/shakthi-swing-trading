import React from 'react';
import { StockData, BenchmarkIndex } from '../types';
import { getStageBadge, getRsiBadgeStyle, getAdxBadgeStyle, getVolumeSurgeBadge, formatCurrency, formatCompactNumber } from '../utils/technicalCalculations';
import { Flame, Star, Mail, ChevronRight, Activity, ArrowUpRight, CheckCircle2, AlertTriangle, Crosshair, Zap } from 'lucide-react';

interface StockTableProps {
  stocks: StockData[];
  selectedBenchmark: BenchmarkIndex;
  selectedStockSymbol: string | null;
  onSelectStock: (stock: StockData) => void;
  onOpenGmailAlert: (stock: StockData, e: React.MouseEvent) => void;
  savedWatchlist?: string[];
  onToggleBookmark?: (symbol: string, e: React.MouseEvent) => void;
  sortBy?: string;
}

export const StockTable: React.FC<StockTableProps> = ({
  stocks,
  selectedBenchmark,
  selectedStockSymbol,
  onSelectStock,
  onOpenGmailAlert,
  savedWatchlist = [],
  onToggleBookmark,
  sortBy,
}) => {
  const isNifty = selectedBenchmark === 'NIFTY_50';
  const benchName = isNifty ? 'NIFTY' : 'S&P 500';

  if (stocks.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-950/40 rounded-xl border border-zinc-800/80 my-4">
        <Activity className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-zinc-300">No stocks matching current volatility, ADX & RS criteria</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          Try relaxing the ADX trend threshold, Minervini score, minimum RS Rating, or volume surge filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 shadow-lg">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider select-none">
            <th className="py-3 px-3.5">Ticker & Market</th>
            <th className="py-3 px-3">Price & Change</th>
            <th className="py-3 px-3 text-center">Trend Template</th>
            <th className="py-3 px-3">VCP & Contractions</th>
            <th className="py-3 px-3">
              <div className="flex items-center gap-1">
                <span>ADX (14)</span>
                <span className="text-[9px] text-teal-400 font-normal lowercase">(&gt;25 Trend)</span>
              </div>
            </th>
            <th className="py-3 px-3">ATR Volatility</th>
            <th className="py-3 px-3">
              <div className="flex items-center gap-1">
                <span>RS vs {benchName}</span>
                <span className="text-[9px] text-emerald-400 font-normal lowercase">(0-99)</span>
              </div>
            </th>
            <th className="py-3 px-3">
              <div className="flex items-center gap-1">
                <span>RSI (14) vs {benchName}</span>
              </div>
            </th>
            <th className="py-3 px-3">Pivot Buy Gate</th>
            <th className="py-3 px-3">Volume Analysis</th>
            <th className="py-3 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 font-sans">
          {stocks.map((stock) => {
            const isSelected = selectedStockSymbol === stock.symbol;
            const stageStyle = getStageBadge(stock.vcpStage);
            const rsiStyle = getRsiBadgeStyle(stock.rsi14);
            const adxStyle = getAdxBadgeStyle(stock.adx14, stock.plusDI, stock.minusDI);
            const volumeStyle = getVolumeSurgeBadge(stock.volumeSurgeRatio, stock.volumeAbove50SMA);
            const rsiSpread = isNifty ? stock.rsiToNiftySpread : stock.rsiToSP500Spread;
            const alpha3M = isNifty ? stock.rsPerformanceVsNifty.alpha3M : stock.rsPerformanceVsSP500.alpha3M;
            const inBuyRange = stock.pctToPivot >= 0 && stock.pctToPivot <= 5.0;
            const testingPivot = stock.pctToPivot < 0 && stock.pctToPivot >= -1.5;

            return (
              <tr
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className={`cursor-pointer transition-colors duration-150 hover:bg-zinc-900/80 ${
                  isSelected ? 'bg-emerald-950/25 ring-1 ring-inset ring-emerald-500/40' : ''
                }`}
              >
                {/* Symbol & Info */}
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    {onToggleBookmark && (
                      <button
                        onClick={(e) => onToggleBookmark(stock.symbol, e)}
                        className={`p-1 rounded hover:bg-zinc-800 transition ${
                          savedWatchlist.includes(stock.symbol)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                        title={savedWatchlist.includes(stock.symbol) ? 'Remove from personal watchlist' : 'Add to personal watchlist'}
                      >
                        <Star className={`w-3.5 h-3.5 ${savedWatchlist.includes(stock.symbol) ? 'fill-amber-400' : ''}`} />
                      </button>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-100 text-sm font-mono">{stock.symbol}</span>
                        <span className="px-1.5 py-0.2 text-[9px] font-mono bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                          {stock.exchange}
                        </span>
                        {stock.rsNewHighAheadOfPrice && (
                          <span
                            title="Relative Strength New High ahead of Price High! Classic Institutional Accumulation."
                            className="px-1 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded flex items-center gap-0.5"
                          >
                            <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            RS Blue Sky
                          </span>
                        )}
                        {stock.volumeAnomaly && (
                          <span
                            title={stock.volumeAnomaly.description}
                            className={`px-1 py-0.2 text-[9px] font-bold border rounded flex items-center gap-0.5 ${
                              stock.volumeAnomaly.type === 'ACCUMULATION_SPIKE'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            }`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                            {stock.volumeAnomaly.type === 'ACCUMULATION_SPIKE' ? 'Vol Spike' : 'Dry-Up'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[160px] sm:max-w-[200px]" title={stock.name}>
                        {stock.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Price & Change */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="font-mono font-semibold text-zinc-100">
                    {formatCurrency(stock.currentPrice, stock.currency)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className={stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400 text-[10px]" title="Distance from 52-week low">
                      +{stock.pctAbove52WLow.toFixed(0)}% 52WL
                    </span>
                  </div>
                </td>

                {/* Minervini Checklist Score & Smart Alpha Rank */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border bg-zinc-900 border-zinc-700">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${stock.checklist.score === 8 ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className={`font-mono font-bold text-xs ${stock.checklist.score === 8 ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {stock.checklist.score}/8
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-mono flex items-center justify-center gap-1" title="Minervini Smart Alpha multi-factor ranking (0-100)">
                    <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    <span>Rank: <strong className="text-emerald-300">{stock.smartRankScore ?? 85}</strong></span>
                  </div>
                </td>

                {/* VCP Stage & Contraction cycles */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${stageStyle.bg}`}>
                      {stageStyle.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 font-mono text-[10px] text-zinc-300">
                      {stock.totalContractions}T
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 font-mono flex items-center gap-1.5">
                    <span>Base: {stock.baseDurationWeeks}W</span>
                    <span>•</span>
                    <span>Depth: -{stock.baseDepthPercent.toFixed(1)}%</span>
                  </div>
                </td>

                {/* ADX (14) Trend Confirmation */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded border font-mono font-bold text-xs ${adxStyle.bg}`}>
                      {stock.adx14.toFixed(1)}
                    </span>
                    {stock.adx14 >= 25 && (
                      <span className="text-[10px] text-emerald-400 font-semibold font-mono" title="ADX > 25 confirms strong trend">
                        ✓ Strong
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5 flex items-center gap-1">
                    <span className={stock.plusDI > stock.minusDI ? 'text-emerald-400' : 'text-rose-400'}>
                      +DI: {stock.plusDI.toFixed(0)}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-500">
                      -DI: {stock.minusDI.toFixed(0)}
                    </span>
                  </div>
                </td>

                {/* ATR Volatility Parameters */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-semibold text-zinc-200">{stock.atrPercent.toFixed(2)}%</span>
                    <span className="text-[10px] px-1 py-0.2 bg-zinc-800 text-teal-300 rounded border border-zinc-700">
                      ATR: {stock.atr14.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Tightening ({stock.atrTrend.toLowerCase()})</span>
                  </div>
                </td>

                {/* Relative Strength vs Benchmark */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold text-sm ${
                          stock.rsRating >= 95 ? 'text-amber-400' : stock.rsRating >= 85 ? 'text-emerald-400' : 'text-sky-300'
                        }`}>
                          {stock.rsRating}
                        </span>
                        <div className="w-12 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              stock.rsRating >= 95 ? 'bg-amber-400' : stock.rsRating >= 85 ? 'bg-emerald-400' : 'bg-sky-400'
                            }`}
                            style={{ width: `${stock.rsRating}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        Alpha 3M: <span className="text-emerald-400 font-semibold">+{alpha3M.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* RSI & Spread to Nifty */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border font-mono font-bold text-xs ${rsiStyle.bg} ${rsiStyle.text}`}>
                      {stock.rsi14.toFixed(1)}
                    </span>
                    <div className="text-[10px] font-mono">
                      <div className={rsiSpread >= 0 ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                        {rsiSpread >= 0 ? `+${rsiSpread.toFixed(1)}` : rsiSpread.toFixed(1)} vs {isNifty ? 'NIFTY' : 'SPX'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Pivot Gate & Distance to Buy Range */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="font-mono text-xs text-zinc-200">
                    {formatCurrency(stock.pivotPrice, stock.currency)}
                  </div>
                  <div className="mt-0.5">
                    {inBuyRange ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Buy Zone (+{stock.pctToPivot.toFixed(1)}%)
                      </span>
                    ) : testingPivot ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        At Gate ({stock.pctToPivot.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-400">
                        {stock.pctToPivot >= 0 ? '+' : ''}{stock.pctToPivot.toFixed(1)}% to Pivot
                      </span>
                    )}
                  </div>
                </td>

                {/* Volume Analysis & Breakout Surge */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono font-bold text-xs ${
                      stock.volumeSurgeRatio >= 2.0 ? 'text-emerald-400' : stock.volumeSurgeRatio >= 1.5 ? 'text-teal-300' : 'text-zinc-300'
                    }`}>
                      {stock.volumeSurgeRatio.toFixed(2)}x
                    </span>
                    {stock.volumeAnomaly ? (
                      <span className={`text-[10px] font-mono px-1 py-0.2 rounded border font-semibold ${
                        stock.volumeAnomaly.type === 'ACCUMULATION_SPIKE'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      }`}>
                        {stock.volumeAnomaly.type === 'ACCUMULATION_SPIKE' ? '🔥 2x Spike' : '💧 Dry-Up'}
                      </span>
                    ) : stock.volumeAbove50SMA ? (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        &gt; 50D SMA
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">50D Vol</span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {formatCompactNumber(stock.volume)} / {formatCompactNumber(stock.avgVolume50D)}
                  </div>
                </td>

                {/* Action Buttons */}
                <td className="py-3 px-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => onOpenGmailAlert(stock, e)}
                      title="Send Instant Breakout Alert to Gmail"
                      className="p-1.5 text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/40 rounded-lg transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectStock(stock)}
                      title="Inspect VCP Chart & Minervini Audit"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-200 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
                    >
                      <span>Chart</span>
                      <ChevronRight className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
