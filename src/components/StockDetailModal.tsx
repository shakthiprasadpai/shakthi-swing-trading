import React, { useState } from 'react';
import { StockData, BenchmarkIndex, BenchmarkMetrics } from '../types';
import { StockChart } from './StockChart';
import { formatCurrency, formatCompactNumber, getStageBadge, getRsiBadgeStyle, calculatePositionSize } from '../utils/technicalCalculations';
import { 
  X, CheckCircle2, XCircle, TrendingUp, ShieldAlert, 
  Calculator, Mail, BarChart2, Flame, Award, ArrowUpRight, Percent, Zap, AlertTriangle
} from 'lucide-react';

interface StockDetailModalProps {
  stock: StockData;
  benchmark: BenchmarkMetrics;
  benchmarkType: BenchmarkIndex;
  onClose: () => void;
  onOpenGmailAlert: (stock: StockData) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  benchmark,
  benchmarkType,
  onClose,
  onOpenGmailAlert,
}) => {
  const [accountCapital, setAccountCapital] = useState<number>(stock.currency === 'INR' ? 1000000 : 50000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0); // 1% account risk
  const [customStop, setCustomStop] = useState<number>(stock.recommendedStopLoss);
  
  const isNifty = benchmarkType === 'NIFTY_50';
  const benchName = isNifty ? 'NIFTY 50' : 'S&P 500';
  const stageStyle = getStageBadge(stock.vcpStage);
  const rsiStyle = getRsiBadgeStyle(stock.rsi14);
  const alpha3M = isNifty ? stock.rsPerformanceVsNifty.alpha3M : stock.rsPerformanceVsSP500.alpha3M;
  const rsiSpread = isNifty ? stock.rsiToNiftySpread : stock.rsiToSP500Spread;

  // Calculate position sizing based on Minervini risk rules
  const positionMetrics = calculatePositionSize(
    accountCapital,
    riskPercent,
    stock.currentPrice,
    customStop
  );

  const checklistItems = [
    {
      title: '1. Price > 150 & 200 SMA',
      pass: stock.checklist.priceAbove150and200SMA,
      desc: `Price ${formatCurrency(stock.currentPrice, stock.currency)} is above 150 SMA (${formatCurrency(stock.sma150, stock.currency)}) and 200 SMA (${formatCurrency(stock.sma200, stock.currency)})`
    },
    {
      title: '2. 150 SMA > 200 SMA',
      pass: stock.checklist.sma150Above200,
      desc: `150 SMA (${formatCurrency(stock.sma150, stock.currency)}) > 200 SMA (${formatCurrency(stock.sma200, stock.currency)}) establishing Stage 2 uptrend`
    },
    {
      title: '3. 200 SMA Trending Up ≥ 1 Month',
      pass: stock.checklist.sma200TrendingUp,
      desc: `200-day moving average has been rising consistently for ${stock.sma200TrendingUpDays} trading days`
    },
    {
      title: '4. 50 SMA > 150 & 200 SMA',
      pass: stock.checklist.sma50Above150and200,
      desc: `50 SMA (${formatCurrency(stock.sma50, stock.currency)}) confirms intermediate momentum above longer moving averages`
    },
    {
      title: '5. Current Price > 50 SMA',
      pass: stock.checklist.priceAbove50SMA,
      desc: `Price trading above 50-day moving average indicating active institutional demand`
    },
    {
      title: '6. Price ≥ 30% Above 52-Week Low',
      pass: stock.checklist.price30PctAbove52WLow,
      desc: `Stock is up +${stock.pctAbove52WLow.toFixed(1)}% from 52W low (${formatCurrency(stock.low52W, stock.currency)}), passing Minervini 30% threshold`
    },
    {
      title: '7. Price within 25% of 52-Week High',
      pass: stock.checklist.priceWithin25Pct52WHigh,
      desc: `Stock is ${Math.abs(stock.pctFrom52WHigh).toFixed(1)}% from 52W high (${formatCurrency(stock.high52W, stock.currency)}), showing close proximity to new highs`
    },
    {
      title: '8. Relative Strength (RS Rating) ≥ 70',
      pass: stock.checklist.rsRatingAbove70,
      desc: `RS Rating is in the ${stock.rsRating}th percentile vs ${benchName}, outperforming ${stock.rsRating}% of all stocks`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100 font-mono">{stock.symbol}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {stock.exchange}
                </span>
                <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${stageStyle.bg}`}>
                  {stageStyle.label}
                </span>
                {stock.rsNewHighAheadOfPrice && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    RS Blue Sky
                  </span>
                )}
                {stock.volumeAnomaly && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold border rounded flex items-center gap-1 ${
                    stock.volumeAnomaly.type === 'ACCUMULATION_SPIKE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  }`}>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {stock.volumeAnomaly.type === 'ACCUMULATION_SPIKE' ? '🔥 Volume Spike' : '💧 Volume Dry-Up'}
                  </span>
                )}
                {stock.smartRankScore != null && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Smart Rank {stock.smartRankScore}/100
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">{stock.name} • {stock.sector} • {stock.industry}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenGmailAlert(stock)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Gmail Alert</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Key Metrics Quick Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Current Price</span>
              <div className="font-mono text-base font-bold text-zinc-100 mt-0.5">
                {formatCurrency(stock.currentPrice, stock.currency)}
              </div>
              <span className={`text-xs font-mono font-semibold ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Pivot Buy Point</span>
              <div className="font-mono text-base font-bold text-emerald-400 mt-0.5">
                {formatCurrency(stock.pivotPrice, stock.currency)}
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {stock.pctToPivot >= 0 ? `+${stock.pctToPivot.toFixed(1)}% in buy zone` : `${stock.pctToPivot.toFixed(1)}% to pivot`}
              </span>
            </div>

            {/* ADX (14) Trend Confirmation */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">ADX (14)</span>
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                  stock.adx14 >= 25 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {stock.adx14 >= 25 ? '≥25 Trend' : '<25 Range'}
                </span>
              </div>
              <div className="font-mono text-base font-bold text-teal-300 mt-0.5">
                {stock.adx14.toFixed(1)}
              </div>
              <span className="text-[10px] font-mono text-zinc-400 block truncate">
                +DI {stock.plusDI.toFixed(0)} | -DI {stock.minusDI.toFixed(0)}
              </span>
            </div>

            {/* Volume Surge & 50-Day SMA */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Volume Surge</span>
                {stock.isVolumeBreakout && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Breakout
                  </span>
                )}
              </div>
              <div className="font-mono text-base font-bold text-emerald-400 mt-0.5">
                {stock.volumeSurgeRatio.toFixed(2)}x
              </div>
              <span className={`text-[10px] font-mono ${stock.volumeAbove50SMA ? 'text-teal-400 font-semibold' : 'text-zinc-400'}`}>
                {stock.volumeAbove50SMA ? 'Above 50D SMA' : 'Below 50D SMA'}
              </span>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">RS vs {benchName}</span>
              <div className="font-mono text-base font-bold text-amber-400 mt-0.5">
                {stock.rsRating} / 99
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                +{alpha3M.toFixed(1)}% 3M Alpha
              </span>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">RSI vs {benchName}</span>
              <div className="font-mono text-base font-bold text-teal-300 mt-0.5">
                {stock.rsi14.toFixed(1)}
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                +{rsiSpread.toFixed(1)} pts vs {isNifty ? 'NIFTY' : 'SPX'}
              </span>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">ATR Volatility</span>
              <div className="font-mono text-base font-bold text-zinc-200 mt-0.5">
                {stock.atrPercent.toFixed(2)}%
              </div>
              <span className="text-[11px] font-mono text-teal-400">
                ATR(14): {stock.atr14.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Interactive Chart with VCP Arcs, RS Line & RSI Subpanels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Technical Execution Chart with Volatility & Relative Strength</span>
              </h3>
              <span className="text-xs text-zinc-500 font-mono">Benchmark: {benchmark.name} ({benchmark.symbol})</span>
            </div>
            <StockChart stock={stock} benchmark={benchmark} benchmarkType={benchmarkType} />
          </div>

          {/* Dual Column: Minervini 8-Point Audit & Volatility Contraction Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Column 1: Minervini 8-Point Trend Template Audit */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Minervini 8-Point Trend Template
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  stock.checklist.score === 8 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  Score: {stock.checklist.score} / 8 Passed
                </span>
              </div>

              <div className="space-y-2.5 mt-3">
                {checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs transition ${
                      item.pass
                        ? 'bg-zinc-950/60 border-zinc-800/80'
                        : 'bg-rose-950/20 border-rose-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.pass ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-zinc-200">{item.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        item.pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {item.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 pl-6">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Volatility Contraction Pattern (VCP) & Relative Strength Table */}
            <div className="space-y-6">
              
              {/* VCP Contraction Cycles Table */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      Volatility Contraction Cycles ({stock.totalContractions}T VCP)
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    Base: {stock.baseDurationWeeks} Weeks (-{stock.baseDepthPercent.toFixed(1)}%)
                  </span>
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800 text-[10px] uppercase font-semibold">
                        <th className="py-2 px-2">Cycle</th>
                        <th className="py-2 px-2">Contraction Depth</th>
                        <th className="py-2 px-2">Duration</th>
                        <th className="py-2 px-2">Volume Reduction</th>
                        <th className="py-2 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {stock.contractions.map((c) => (
                        <tr key={c.contractionNumber}>
                          <td className="py-2.5 px-2 font-bold text-zinc-300">T{c.contractionNumber}</td>
                          <td className="py-2.5 px-2 text-sky-400 font-bold">{c.depthPercent}%</td>
                          <td className="py-2.5 px-2 text-zinc-400">{c.durationDays} days</td>
                          <td className="py-2.5 px-2 text-emerald-400">{c.volumeReductionPercent}% (Dry-up)</td>
                          <td className="py-2.5 px-2 text-right text-zinc-400">
                            {c.contractionNumber === stock.totalContractions ? 'Cheat/Pivot Area' : 'Completed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                  <strong>VCP Rule:</strong> Each successive contraction must be tighter than the previous one, with volume progressively drying up on down-days. This demonstrates that overhead supply has been absorbed by institutional accumulation.
                </div>
              </div>

              {/* Relative Strength vs Benchmark Comparison Table */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      Relative Strength vs {benchName} & Alpha
                    </h3>
                  </div>
                  <span className="text-xs text-amber-400 font-bold font-mono">
                    RS Rating: {stock.rsRating}/99
                  </span>
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800 text-[10px] uppercase font-semibold font-sans">
                        <th className="py-1.5 px-2">Time Horizon</th>
                        <th className="py-1.5 px-2">{stock.symbol} Return</th>
                        <th className="py-1.5 px-2">{benchName} Return</th>
                        <th className="py-1.5 px-2 text-right">Alpha Spread</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {isNifty ? (
                        <>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">1 Month</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsNifty.perf1M}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsNifty.nifty1M}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{(stock.rsPerformanceVsNifty.perf1M - stock.rsPerformanceVsNifty.nifty1M).toFixed(1)}%
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">3 Month</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsNifty.perf3M}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsNifty.nifty3M}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{stock.rsPerformanceVsNifty.alpha3M.toFixed(1)}%
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">6 Month</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsNifty.perf6M}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsNifty.nifty6M}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{(stock.rsPerformanceVsNifty.perf6M - stock.rsPerformanceVsNifty.nifty6M).toFixed(1)}%
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">1 Year</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsNifty.perf1Y}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsNifty.nifty1Y}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{(stock.rsPerformanceVsNifty.perf1Y - stock.rsPerformanceVsNifty.nifty1Y).toFixed(1)}%
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">1 Month</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsSP500.perf1M}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsSP500.sp1M}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{(stock.rsPerformanceVsSP500.perf1M - stock.rsPerformanceVsSP500.sp1M).toFixed(1)}%
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">3 Month</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsSP500.perf3M}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsSP500.sp3M}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{stock.rsPerformanceVsSP500.alpha3M.toFixed(1)}%
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">6 Month</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsSP500.perf6M}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsSP500.sp6M}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{(stock.rsPerformanceVsSP500.perf6M - stock.rsPerformanceVsSP500.sp6M).toFixed(1)}%
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-zinc-400 font-sans">1 Year</td>
                            <td className="py-2 px-2 text-emerald-400 font-bold">+{stock.rsPerformanceVsSP500.perf1Y}%</td>
                            <td className="py-2 px-2 text-zinc-400">+{stock.rsPerformanceVsSP500.sp1Y}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                              +{(stock.rsPerformanceVsSP500.perf1Y - stock.rsPerformanceVsSP500.sp1Y).toFixed(1)}%
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>

          {/* ADX (14) & Volume Analysis Module */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* ADX Trend Indicator Card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                      Average Directional Index (ADX 14)
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Trend strength & directional movement verification
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  stock.adx14 >= 25 
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {stock.adx14 >= 25 ? '✓ Strong Trend (≥25)' : 'Developing Trend (<25)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">ADX Value</span>
                  <span className={`font-mono text-base font-bold ${stock.adx14 >= 25 ? 'text-teal-300' : 'text-zinc-300'}`}>
                    {stock.adx14.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-zinc-500 block font-mono">Benchmark &gt; 25.0</span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">+DI (Bullish)</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {stock.plusDI.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-emerald-500/80 block font-mono">Buyers Dominant</span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">-DI (Bearish)</span>
                  <span className="font-mono text-base font-bold text-rose-400">
                    {stock.minusDI.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-zinc-500 block font-mono">Sellers Subdued</span>
                </div>
              </div>

              {/* Progress bar representing ADX 0-60 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Trend Strength: <strong className="text-teal-300">{stock.adxTrendStrength}</strong></span>
                  <span>{stock.adx14.toFixed(1)} / 60</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, (stock.adx14 / 60) * 100)}%` }}
                  />
                  {/* 25 line marker (25/60 = 41.6%) */}
                  <div className="absolute top-0 bottom-0 left-[41.6%] w-0.5 bg-amber-400/80" />
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono pt-0.5">
                  <span>0 (Rangebound)</span>
                  <span className="text-amber-400 font-semibold">25.0 Key Gate</span>
                  <span>60+ (Power Trend)</span>
                </div>
              </div>
            </div>

            {/* Volume Analysis Card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                      Volume Analysis & 50-Day Moving Average
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Breakout volume surge vs 50-day average trading volume
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  stock.isVolumeBreakout 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : stock.volumeAbove50SMA 
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {stock.isVolumeBreakout ? '⚡ Breakout Surge (≥1.5x)' : stock.volumeAbove50SMA ? 'Above 50D SMA' : 'Below 50D SMA'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">Surge vs 50D SMA</span>
                  <span className={`font-mono text-base font-bold ${stock.isVolumeBreakout ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {stock.volumeSurgeRatio.toFixed(2)}x
                  </span>
                  <span className="text-[9px] text-zinc-500 block font-mono">Req: &gt;1.50x</span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">50D SMA Volume</span>
                  <span className="font-mono text-base font-bold text-sky-300">
                    {formatCompactNumber(stock.avgVolume50D)}
                  </span>
                  <span className="text-[9px] text-zinc-500 block font-mono">Institutional Base</span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">Recent Action</span>
                  <span className="font-mono text-xs font-bold text-teal-300 block mt-1">
                    {stock.recentVolumeTrend}
                  </span>
                  <span className="text-[9px] text-zinc-500 block font-mono">Base Dry-Up → Surge</span>
                </div>
              </div>

              {/* Volume surge gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Current Volume vs 50-Day Benchmark</span>
                  <span className="font-bold text-emerald-400">{stock.volumeSurgeRatio.toFixed(2)}x of 50-day average</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, (stock.volumeSurgeRatio / 3.0) * 100)}%` }}
                  />
                  {/* 1.5x marker (1.5/3 = 50%) */}
                  <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-emerald-300" />
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono pt-0.5">
                  <span>0.5x</span>
                  <span className="text-emerald-400 font-semibold">1.5x Breakout Gate</span>
                  <span>3.0x+ High Volume Surge</span>
                </div>
              </div>
            </div>

          </div>

          {/* Risk Management & Position Sizing Calculator (Minervini Discipline) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">
                    Minervini Position Sizing & Risk Calculator
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Strict capital protection: 1% account equity risk with asymmetrical 2:1 and 3:1 reward targets.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                <span>R:R Ratio Target:</span>
                <span className="font-bold text-emerald-400">2.5 : 1 Optimal</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              
              {/* Account Capital Input */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold uppercase block mb-1">
                  Total Trading Capital
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={accountCapital}
                    onChange={(e) => setAccountCapital(Math.max(1000, Number(e.target.value)))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono">
                    {stock.currency}
                  </span>
                </div>
              </div>

              {/* Risk % per trade */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold uppercase block mb-1">
                  Account Risk %
                </label>
                <select
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 outline-none focus:border-emerald-500"
                >
                  <option value={0.5}>0.5% (Conservative)</option>
                  <option value={1.0}>1.0% (Minervini Standard)</option>
                  <option value={1.5}>1.5% (Aggressive)</option>
                  <option value={2.0}>2.0% (Maximum Cap)</option>
                </select>
              </div>

              {/* Entry Price (Pivot) */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold uppercase block mb-1">
                  Entry Price (Pivot)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(stock.currentPrice, stock.currency)}
                  className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 font-bold outline-none"
                />
              </div>

              {/* Stop Loss Input */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold uppercase block mb-1">
                  Stop Loss Price
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={customStop}
                  onChange={(e) => setCustomStop(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-rose-400 font-bold outline-none focus:border-rose-500"
                />
              </div>

            </div>

            {/* Calculated Results Strip */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Max Position Size</span>
                <div className="font-mono font-bold text-sm text-zinc-100 mt-0.5">
                  {positionMetrics.shares} Shares
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatCurrency(positionMetrics.totalInvestment, stock.currency)} ({positionMetrics.capitalAllocationPct}% Portfolio)
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Risk at Stop Loss</span>
                <div className="font-mono font-bold text-sm text-rose-400 mt-0.5">
                  {formatCurrency(positionMetrics.maxLossAmount, stock.currency)}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Exact {riskPercent}% of Total Capital
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Target 1 (2:1 R/R)</span>
                <div className="font-mono font-bold text-sm text-teal-400 mt-0.5">
                  {formatCurrency(stock.targetPrice2R, stock.currency)}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Gain: +{formatCurrency((stock.targetPrice2R - stock.currentPrice) * positionMetrics.shares, stock.currency)}
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Target 2 (3:1 R/R)</span>
                <div className="font-mono font-bold text-sm text-emerald-400 mt-0.5">
                  {formatCurrency(stock.targetPrice3R, stock.currency)}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Gain: +{formatCurrency((stock.targetPrice3R - stock.currentPrice) * positionMetrics.shares, stock.currency)}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Minervini Trend Trading & Volatility Engine Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            Close Audit
          </button>
        </div>

      </div>
    </div>
  );
};
