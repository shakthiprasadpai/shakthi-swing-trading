import React, { useState, useRef } from 'react';
import { StockData, BenchmarkIndex, BenchmarkMetrics, PricePoint } from '../types';
import { formatCurrency, formatCompactNumber, getRsiBadgeStyle } from '../utils/technicalCalculations';
import { Eye, Layers, TrendingUp, BarChart2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface StockChartProps {
  stock: StockData;
  benchmark: BenchmarkMetrics;
  benchmarkType: BenchmarkIndex;
}

export const StockChart: React.FC<StockChartProps> = ({
  stock,
  benchmark,
  benchmarkType,
}) => {
  const [chartMode, setChartMode] = useState<'candles' | 'line'>('candles');
  const [oscillatorTab, setOscillatorTab] = useState<'ADX' | 'RSI'>('ADX');
  const [showMA, setShowMA] = useState({ sma20: true, sma50: true, sma150: true, sma200: true });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  const data = stock.historicalData;
  const isNifty = benchmarkType === 'NIFTY_50';
  const benchName = isNifty ? 'NIFTY 50' : 'S&P 500';

  // Sizing and layout coordinates
  const svgWidth = 900;
  const totalHeight = 560;
  const paddingLeft = 16;
  const paddingRight = 75;
  const paddingTop = 24;

  // Panel partitions:
  // Price panel: 0 to 290
  // Volume panel: 300 to 380
  // RS Line panel: 390 to 460
  // Oscillator (ADX / RSI) panel: 470 to 540
  const priceTop = paddingTop;
  const priceHeight = 260;
  const priceBottom = priceTop + priceHeight;

  const volTop = 300;
  const volHeight = 70;
  const volBottom = volTop + volHeight;

  const rsTop = 385;
  const rsHeight = 70;
  const rsBottom = rsTop + rsHeight;

  const rsiTop = 470;
  const rsiHeight = 70;
  const rsiBottom = rsiTop + rsiHeight;

  // Min and max for Price panel
  const allHighs = data.map(d => d.high);
  const allLows = data.map(d => d.low);
  const minPrice = Math.min(...allLows, stock.recommendedStopLoss * 0.98);
  const maxPrice = Math.max(...allHighs, stock.pivotPrice * 1.06);
  const priceRange = maxPrice - minPrice || 1;

  const getYForPrice = (p: number) => {
    return priceBottom - ((p - minPrice) / priceRange) * priceHeight;
  };

  // Max volume for Volume panel
  const maxVol = Math.max(...data.map(d => d.volume), stock.avgVolume50D * 2.5);
  const getYForVol = (v: number) => {
    return volBottom - (v / maxVol) * volHeight;
  };

  // Min and max for RS Line
  const rsValues = data.map(d => d.rsLine || 100);
  const minRS = Math.min(...rsValues) * 0.98;
  const maxRS = Math.max(...rsValues) * 1.02;
  const rsRange = maxRS - minRS || 1;
  const getYForRS = (rs: number) => {
    return rsBottom - ((rs - minRS) / rsRange) * rsHeight;
  };

  // RSI is bounded 0 to 100
  const getYForRSI = (rsi: number) => {
    return rsiBottom - (rsi / 100) * rsiHeight;
  };

  // ADX scale bounded 0 to 65
  const maxADX = 65;
  const getYForADX = (val: number) => {
    return rsiBottom - (Math.min(maxADX, Math.max(0, val)) / maxADX) * rsiHeight;
  };

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const count = data.length;
  const candleWidth = Math.max(2, (chartWidth / count) * 0.65);

  const getXForIndex = (i: number) => {
    return paddingLeft + (i / (count - 1)) * chartWidth;
  };

  // Current active hover item or latest
  const activeItem: PricePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];
  const activeIndex = hoverIndex !== null ? hoverIndex : data.length - 1;

  // Build SVG path for Line mode and Moving Averages
  const buildLinePath = (getter: (d: PricePoint) => number | undefined) => {
    let path = '';
    let first = true;
    for (let i = 0; i < data.length; i++) {
      const val = getter(data[i]);
      if (val === undefined || isNaN(val)) continue;
      const x = getXForIndex(i);
      const y = getYForPrice(val);
      if (first) {
        path += `M ${x} ${y}`;
        first = false;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    return path;
  };

  // RS Line path
  const buildRSPath = () => {
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const x = getXForIndex(i);
      const y = getYForRS(data[i].rsLine || 100);
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }
    return path;
  };

  // RSI Path
  const buildRSIPath = () => {
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const x = getXForIndex(i);
      const y = getYForRSI(data[i].rsi || 50);
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }
    return path;
  };

  // Benchmark RSI path comparison
  const buildBenchmarkRSIPath = () => {
    const benchHistory = benchmark.history.slice(-data.length);
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const benchPoint = benchHistory[i];
      const rsiVal = benchPoint ? benchPoint.rsi : benchmark.rsi14;
      const x = getXForIndex(i);
      const y = getYForRSI(rsiVal);
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }
    return path;
  };

  // ADX Path
  const buildADXPath = () => {
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const x = getXForIndex(i);
      const val = data[i].adx ?? stock.adx14;
      const y = getYForADX(val);
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }
    return path;
  };

  // +DI Path
  const buildPlusDIPath = () => {
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const x = getXForIndex(i);
      const val = data[i].plusDI ?? stock.plusDI;
      const y = getYForADX(val);
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }
    return path;
  };

  // -DI Path
  const buildMinusDIPath = () => {
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const x = getXForIndex(i);
      const val = data[i].minusDI ?? stock.minusDI;
      const y = getYForADX(val);
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }
    return path;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = (mouseX - paddingLeft) / chartWidth;
    const idx = Math.round(ratio * (count - 1));
    if (idx >= 0 && idx < count) {
      setHoverIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl select-none">
      
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        
        {/* Active Candle Metrics Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-100 font-mono">{stock.symbol}</span>
            <span className="text-[11px] text-zinc-400 font-mono">{activeItem.date}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>O: <strong className="text-zinc-200">{formatCurrency(activeItem.open, stock.currency)}</strong></span>
            <span>H: <strong className="text-emerald-400">{formatCurrency(activeItem.high, stock.currency)}</strong></span>
            <span>L: <strong className="text-rose-400">{formatCurrency(activeItem.low, stock.currency)}</strong></span>
            <span>C: <strong className="text-zinc-100">{formatCurrency(activeItem.close, stock.currency)}</strong></span>
            <span>Vol: <strong className="text-sky-300">{formatCompactNumber(activeItem.volume)}</strong></span>
            {activeItem.volume > stock.avgVolume50D && (
              <span className="text-teal-300 font-bold text-[10px] bg-teal-500/15 px-1.5 py-0.5 rounded border border-teal-500/30">
                +{(activeItem.volume / stock.avgVolume50D).toFixed(1)}x 50D SMA
              </span>
            )}
          </div>
        </div>

        {/* Chart View Controls & MA Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Sub-panel Oscillator Selector: ADX vs RSI */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setOscillatorTab('ADX')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                oscillatorTab === 'ADX' ? 'bg-teal-900/60 text-teal-200 border border-teal-500/40 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>ADX (14) Trend</span>
              <span className="text-[9px] font-mono font-bold text-teal-400">&gt;25</span>
            </button>
            <button
              onClick={() => setOscillatorTab('RSI')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                oscillatorTab === 'RSI' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              RSI (14)
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setChartMode('candles')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                chartMode === 'candles' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                chartMode === 'line' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Line
            </button>
          </div>

          {/* Moving Average Indicators Toggle */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <button
              onClick={() => setShowMA({ ...showMA, sma20: !showMA.sma20 })}
              className={`px-1.5 py-0.5 rounded border transition ${
                showMA.sma20 ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'text-zinc-500 border-zinc-800'
              }`}
            >
              20 EMA
            </button>
            <button
              onClick={() => setShowMA({ ...showMA, sma50: !showMA.sma50 })}
              className={`px-1.5 py-0.5 rounded border transition ${
                showMA.sma50 ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'text-zinc-500 border-zinc-800'
              }`}
            >
              50 SMA
            </button>
            <button
              onClick={() => setShowMA({ ...showMA, sma150: !showMA.sma150 })}
              className={`px-1.5 py-0.5 rounded border transition ${
                showMA.sma150 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'text-zinc-500 border-zinc-800'
              }`}
            >
              150 SMA
            </button>
            <button
              onClick={() => setShowMA({ ...showMA, sma200: !showMA.sma200 })}
              className={`px-1.5 py-0.5 rounded border transition ${
                showMA.sma200 ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'text-zinc-500 border-zinc-800'
              }`}
            >
              200 SMA
            </button>
          </div>

        </div>

      </div>

      {/* SVG Chart Engine */}
      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Gradient for buy range */}
            <linearGradient id="buyRangeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
            </linearGradient>
            {/* Gradient for RS line fill */}
            <linearGradient id="rsLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
            {/* Gradient for RSI fill */}
            <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* ================= BACKGROUND GRIDS ================= */}
          {/* Price Panel Horizontal Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const p = minPrice + ratio * priceRange;
            const y = getYForPrice(p);
            return (
              <g key={`p-grid-${ratio}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={svgWidth - paddingRight + 6}
                  y={y + 3}
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {formatCurrency(p, stock.currency)}
                </text>
              </g>
            );
          })}

          {/* ================= MINERVINI VCP ANNOTATIONS ================= */}
          {/* Pivot Gate Line & Buy Range (Pivot to Pivot + 5%) */}
          {(() => {
            const pivotY = getYForPrice(stock.pivotPrice);
            const buyMaxY = getYForPrice(stock.pivotPrice * 1.05);
            return (
              <g key="pivot-group">
                {/* 5% Buy Range shaded zone */}
                <rect
                  x={paddingLeft}
                  y={buyMaxY}
                  width={chartWidth}
                  height={Math.max(2, pivotY - buyMaxY)}
                  fill="url(#buyRangeGrad)"
                />
                <line
                  x1={paddingLeft}
                  y1={pivotY}
                  x2={svgWidth - paddingRight}
                  y2={pivotY}
                  stroke="#10b981"
                  strokeWidth="1.4"
                  strokeDasharray="4 2"
                />
                <text
                  x={paddingLeft + 8}
                  y={pivotY - 4}
                  fill="#34d399"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  PIVOT BUY POINT: {formatCurrency(stock.pivotPrice, stock.currency)} (Buy up to +5%)
                </text>
              </g>
            );
          })()}

          {/* Recommended Stop Loss Line */}
          {(() => {
            const stopY = getYForPrice(stock.recommendedStopLoss);
            return (
              <g key="stop-group">
                <line
                  x1={paddingLeft}
                  y1={stopY}
                  x2={svgWidth - paddingRight}
                  y2={stopY}
                  stroke="#f43f5e"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft + 8}
                  y={stopY - 4}
                  fill="#fb7185"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  STOP LOSS: {formatCurrency(stock.recommendedStopLoss, stock.currency)} (-{stock.riskPercent}%)
                </text>
              </g>
            );
          })()}

          {/* VCP Contraction Wave Arcs across the last 3 contractions */}
          {(() => {
            const lastX = getXForIndex(count - 1);
            const t3X = getXForIndex(Math.max(0, count - 8));
            const t2X = getXForIndex(Math.max(0, count - 24));
            const t1X = getXForIndex(Math.max(0, count - 55));
            const baseHighY = getYForPrice(stock.high52W * 0.99);

            return (
              <g key="vcp-arcs" opacity="0.85">
                {/* Contraction 1 Arc */}
                <path
                  d={`M ${t1X} ${baseHighY} Q ${(t1X + t2X) / 2} ${baseHighY + 30} ${t2X} ${baseHighY}`}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <text
                  x={(t1X + t2X) / 2 - 14}
                  y={baseHighY + 42}
                  fill="#818cf8"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  T1: -{Math.abs(stock.contractions[0]?.depthPercent || 18)}%
                </text>

                {/* Contraction 2 Arc */}
                <path
                  d={`M ${t2X} ${baseHighY} Q ${(t2X + t3X) / 2} ${baseHighY + 18} ${t3X} ${baseHighY}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <text
                  x={(t2X + t3X) / 2 - 14}
                  y={baseHighY + 30}
                  fill="#38bdf8"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  T2: -{Math.abs(stock.contractions[1]?.depthPercent || 9)}%
                </text>

                {/* Contraction 3 / Cheat Area Arc */}
                {stock.contractions[2] && (
                  <>
                    <path
                      d={`M ${t3X} ${baseHighY} Q ${(t3X + lastX) / 2} ${baseHighY + 8} ${lastX} ${baseHighY}`}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.4"
                    />
                    <text
                      x={(t3X + lastX) / 2 - 14}
                      y={baseHighY + 20}
                      fill="#34d399"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      T3: -{Math.abs(stock.contractions[2]?.depthPercent || 4)}%
                    </text>
                  </>
                )}
              </g>
            );
          })()}

          {/* ================= MOVING AVERAGES ================= */}
          {showMA.sma200 && (
            <path d={buildLinePath(d => d.sma200)} fill="none" stroke="#f43f5e" strokeWidth="1.2" opacity="0.8" />
          )}
          {showMA.sma150 && (
            <path d={buildLinePath(d => d.sma150)} fill="none" stroke="#818cf8" strokeWidth="1.2" opacity="0.8" />
          )}
          {showMA.sma50 && (
            <path d={buildLinePath(d => d.sma50)} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
          )}
          {showMA.sma20 && (
            <path d={buildLinePath(d => d.sma20)} fill="none" stroke="#fbbf24" strokeWidth="1.2" />
          )}

          {/* ================= CANDLESTICKS / LINE ================= */}
          {chartMode === 'candles' ? (
            data.map((d, i) => {
              const x = getXForIndex(i);
              const isUp = d.close >= d.open;
              const candleColor = isUp ? '#10b981' : '#f43f5e';
              const highY = getYForPrice(d.high);
              const lowY = getYForPrice(d.low);
              const openY = getYForPrice(d.open);
              const closeY = getYForPrice(d.close);
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

              return (
                <g key={`candle-${i}`}>
                  {/* High/Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth="1"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={isUp ? '#10b981' : '#f43f5e'}
                    rx="0.5"
                  />
                </g>
              );
            })
          ) : (
            <path
              d={buildLinePath(d => d.close)}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
          )}

          {/* ================= VOLUME PANEL ================= */}
          {/* Panel label & divider */}
          <line x1={paddingLeft} y1={volTop - 8} x2={svgWidth - paddingRight} y2={volTop - 8} stroke="#27272a" />
          <text x={paddingLeft} y={volTop + 10} fill="#71717a" fontSize="9" fontWeight="bold" fontFamily="monospace">
            VOLUME (50-Day SMA Overlay)
          </text>
          
          {/* Volume 50-day SMA guide line */}
          {(() => {
            const avgVolY = getYForVol(stock.avgVolume50D);
            return (
              <line
                x1={paddingLeft}
                y1={avgVolY}
                x2={svgWidth - paddingRight}
                y2={avgVolY}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            );
          })()}

          {/* Volume Bars */}
          {data.map((d, i) => {
            const x = getXForIndex(i);
            const isUp = d.close >= d.open;
            const y = getYForVol(d.volume);
            const h = Math.max(1, volBottom - y);
            const isBreakoutSpike = d.volume >= stock.avgVolume50D * 1.5;
            const barFill = isBreakoutSpike ? '#34d399' : isUp ? '#065f46' : '#881337';

            return (
              <rect
                key={`vol-${i}`}
                x={x - candleWidth / 2}
                y={y}
                width={candleWidth}
                height={h}
                fill={barFill}
                opacity={isBreakoutSpike ? 1 : 0.75}
              />
            );
          })}

          {/* ================= RELATIVE STRENGTH (RS) LINE PANEL ================= */}
          <line x1={paddingLeft} y1={rsTop - 8} x2={svgWidth - paddingRight} y2={rsTop - 8} stroke="#27272a" />
          <text x={paddingLeft} y={rsTop + 10} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
            RELATIVE STRENGTH LINE VS {benchName} (Alpha Rating: {stock.rsRating}/99)
          </text>
          <text x={svgWidth - paddingRight + 6} y={rsTop + 20} fill="#38bdf8" fontSize="9" fontFamily="monospace">
            RS Line
          </text>

          {/* RS Line curve */}
          <path
            d={buildRSPath()}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2"
          />

          {/* ================= OSCILLATOR PANEL (ADX OR RSI) ================= */}
          <line x1={paddingLeft} y1={rsiTop - 8} x2={svgWidth - paddingRight} y2={rsiTop - 8} stroke="#27272a" />
          
          {oscillatorTab === 'ADX' ? (
            /* ADX (14) Indicator with Directional Movement (+DI / -DI) and 25 Trend Confirmation Gate */
            <g key="adx-panel">
              {/* Panel Header */}
              <text x={paddingLeft} y={rsiTop + 10} fill="#2dd4bf" fontSize="9" fontWeight="bold" fontFamily="monospace">
                ADX (14) TREND CONFIRMATION: {stock.adx14.toFixed(1)} (+DI: {stock.plusDI.toFixed(1)} | -DI: {stock.minusDI.toFixed(1)}) — {stock.adxTrendStrength}
              </text>

              {/* Shaded Strong Trend Zone (ADX >= 25) */}
              <rect
                x={paddingLeft}
                y={getYForADX(65)}
                width={chartWidth}
                height={Math.max(0, getYForADX(25) - getYForADX(65))}
                fill="#0d9488"
                opacity="0.08"
              />

              {/* 25 Strong Trend Key Threshold Line */}
              <line
                x1={paddingLeft}
                y1={getYForADX(25)}
                x2={svgWidth - paddingRight}
                y2={getYForADX(25)}
                stroke="#eab308"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              <text x={svgWidth - paddingRight + 6} y={getYForADX(25) + 3} fill="#eab308" fontSize="8" fontWeight="bold" fontFamily="monospace">
                25 TREND
              </text>

              {/* 20 Developing Trend Line */}
              <line
                x1={paddingLeft}
                y1={getYForADX(20)}
                x2={svgWidth - paddingRight}
                y2={getYForADX(20)}
                stroke="#52525b"
                strokeDasharray="2 2"
                strokeWidth="0.8"
              />
              <text x={svgWidth - paddingRight + 6} y={getYForADX(20) + 3} fill="#71717a" fontSize="8" fontFamily="monospace">
                20 BASE
              </text>

              {/* +DI Line (Positive Directional Movement - Emerald) */}
              <path
                d={buildPlusDIPath()}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.4"
                opacity="0.85"
              />

              {/* -DI Line (Negative Directional Movement - Rose) */}
              <path
                d={buildMinusDIPath()}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.4"
                strokeDasharray="3 2"
                opacity="0.8"
              />

              {/* ADX Main Trend Strength Curve (Cyan/Teal) */}
              <path
                d={buildADXPath()}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
            </g>
          ) : (
            /* RSI (14) Momentum Indicator */
            <g key="rsi-panel">
              <text x={paddingLeft} y={rsiTop + 10} fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace">
                RSI (14) MOMENTUM: {stock.rsi14.toFixed(1)} vs {benchName} ({benchmark.rsi14})
              </text>

              {/* 70 Overbought line */}
              <line
                x1={paddingLeft}
                y1={getYForRSI(70)}
                x2={svgWidth - paddingRight}
                y2={getYForRSI(70)}
                stroke="#e11d48"
                strokeDasharray="2 2"
                strokeWidth="0.8"
              />
              <text x={svgWidth - paddingRight + 6} y={getYForRSI(70) + 3} fill="#f43f5e" fontSize="8" fontFamily="monospace">
                70 OB
              </text>

              {/* 50 Centerline (Minervini Bullish Support Zone) */}
              <line
                x1={paddingLeft}
                y1={getYForRSI(50)}
                x2={svgWidth - paddingRight}
                y2={getYForRSI(50)}
                stroke="#52525b"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <text x={svgWidth - paddingRight + 6} y={getYForRSI(50) + 3} fill="#a1a1aa" fontSize="8" fontFamily="monospace">
                50 Mid
              </text>

              {/* 30 Oversold line */}
              <line
                x1={paddingLeft}
                y1={getYForRSI(30)}
                x2={svgWidth - paddingRight}
                y2={getYForRSI(30)}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth="0.8"
              />
              <text x={svgWidth - paddingRight + 6} y={getYForRSI(30) + 3} fill="#34d399" fontSize="8" fontFamily="monospace">
                30 OS
              </text>

              {/* Benchmark RSI line (subtle comparison) */}
              <path
                d={buildBenchmarkRSIPath()}
                fill="none"
                stroke="#71717a"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />

              {/* Stock RSI line */}
              <path
                d={buildRSIPath()}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            </g>
          )}

          {/* ================= INTERACTIVE CROSSHAIR & TOOLTIP ================= */}
          {hoverIndex !== null && (
            <g key="crosshair">
              {/* Vertical line across all panels */}
              <line
                x1={getXForIndex(hoverIndex)}
                y1={priceTop}
                x2={getXForIndex(hoverIndex)}
                y2={rsiBottom}
                stroke="#a1a1aa"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Price level horizontal line */}
              <line
                x1={paddingLeft}
                y1={getYForPrice(activeItem.close)}
                x2={svgWidth - paddingRight}
                y2={getYForPrice(activeItem.close)}
                stroke="#a1a1aa"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Price badge on right axis */}
              <rect
                x={svgWidth - paddingRight}
                y={getYForPrice(activeItem.close) - 8}
                width={70}
                height={16}
                fill="#18181b"
                stroke="#52525b"
                rx="2"
              />
              <text
                x={svgWidth - paddingRight + 4}
                y={getYForPrice(activeItem.close) + 4}
                fill="#f4f4f5"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {formatCurrency(activeItem.close, stock.currency)}
              </text>
            </g>
          )}

        </svg>
      </div>

      {/* Chart Legend Footer */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
            <span>Pivot Buy Gate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span>
            <span>Stop Loss</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-500 inline-block"></span>
            <span>RS Line vs {benchName}</span>
          </span>
          {oscillatorTab === 'ADX' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
                <span>ADX (14)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block"></span>
                <span>+DI (Bullish)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-rose-400 inline-block border-t border-dashed"></span>
                <span>-DI (Bearish)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block border-t border-dashed"></span>
                <span>25 Strong Trend Gate</span>
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block"></span>
                <span>Stock RSI</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-zinc-500 inline-block border-t border-dashed"></span>
                <span>{benchName} RSI</span>
              </span>
            </>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400 inline-block border-t border-dashed"></span>
            <span>50D SMA Volume</span>
          </span>
        </div>
        <div className="font-mono text-[10px] text-zinc-500">
          VCP Contraction Arcs (T1 → T2 → T3) with Volume Dry-Up
        </div>
      </div>

    </div>
  );
};
