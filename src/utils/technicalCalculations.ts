import { StockData, BenchmarkIndex, SectorPerformance } from '../types';

export function calculatePositionSize(
  accountCapital: number,
  riskPercent: number, // e.g. 1% of total account capital
  entryPrice: number,
  stopLossPrice: number
): {
  shares: number;
  totalInvestment: number;
  maxLossAmount: number;
  capitalAllocationPct: number;
  riskRewardRatio2R: number;
} {
  const riskPerShare = Math.max(0.01, entryPrice - stopLossPrice);
  const maxRiskAmount = (accountCapital * riskPercent) / 100;
  const shares = Math.max(1, Math.floor(maxRiskAmount / riskPerShare));
  const totalInvestment = shares * entryPrice;
  const maxLossAmount = shares * riskPerShare;
  const capitalAllocationPct = (totalInvestment / accountCapital) * 100;

  return {
    shares,
    totalInvestment,
    maxLossAmount,
    capitalAllocationPct: Number(capitalAllocationPct.toFixed(1)),
    riskRewardRatio2R: 2.0
  };
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

export function formatCompactNumber(val: number): string {
  if (val >= 1e7) return `${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e5) return `${(val / 1e5).toFixed(1)}L`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
  return val.toString();
}

export function getAdxBadgeStyle(adx: number, plusDI: number, minusDI: number): { bg: string; text: string; label: string; isStrong: boolean } {
  const isBullish = plusDI > minusDI;
  if (adx >= 35) {
    return {
      bg: isBullish ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300',
      text: isBullish ? 'text-purple-300' : 'text-rose-300',
      label: isBullish ? 'Super Trend (>35)' : 'Strong Bear (>35)',
      isStrong: true
    };
  }
  if (adx >= 25) {
    return {
      bg: isBullish ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300',
      text: isBullish ? 'text-emerald-300' : 'text-rose-300',
      label: isBullish ? 'Strong Trend (>25)' : 'Bearish Trend',
      isStrong: true
    };
  }
  if (adx >= 20) {
    return {
      bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      text: 'text-amber-300',
      label: 'Developing (20-25)',
      isStrong: false
    };
  }
  return {
    bg: 'bg-zinc-800/80 border-zinc-700 text-zinc-400',
    text: 'text-zinc-400',
    label: 'Weak Trend (<20)',
    isStrong: false
  };
}

export function getVolumeSurgeBadge(surgeRatio: number, volumeAbove50SMA: boolean): { bg: string; text: string; label: string; isBreakoutVolume: boolean } {
  if (surgeRatio >= 2.0) {
    return {
      bg: 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300',
      text: 'text-emerald-300',
      label: 'Heavy Accumulation (2x+)',
      isBreakoutVolume: true
    };
  }
  if (surgeRatio >= 1.5) {
    return {
      bg: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
      text: 'text-teal-300',
      label: 'Volume Breakout (>1.5x)',
      isBreakoutVolume: true
    };
  }
  if (volumeAbove50SMA) {
    return {
      bg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
      text: 'text-sky-300',
      label: 'Above 50D SMA',
      isBreakoutVolume: false
    };
  }
  return {
    bg: 'bg-zinc-800/80 border-zinc-700 text-zinc-400',
    text: 'text-zinc-400',
    label: 'Below Average',
    isBreakoutVolume: false
  };
}

export function getRsiBadgeStyle(rsi: number): { bg: string; text: string; label: string } {
  if (rsi >= 80) return { bg: 'bg-rose-500/15 border-rose-500/30', text: 'text-rose-400', label: 'Overbought (>80)' };
  if (rsi >= 65) return { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', label: 'Super-Momentum (65-80)' };
  if (rsi >= 50) return { bg: 'bg-teal-500/15 border-teal-500/30', text: 'text-teal-300', label: 'Bullish Zone (50-65)' };
  if (rsi >= 40) return { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', label: 'Neutral (40-50)' };
  return { bg: 'bg-zinc-700/30 border-zinc-600/30', text: 'text-zinc-400', label: 'Weak (<40)' };
}

export function getStageBadge(stage: string): { bg: string; text: string; label: string; iconColor: string } {
  switch (stage) {
    case 'CONFIRMED_BREAKOUT':
      return { bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', text: 'text-emerald-300', label: 'Confirmed Breakout', iconColor: 'text-emerald-400' };
    case 'PIVOT_ALERT':
      return { bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300', text: 'text-amber-300', label: 'Testing Pivot Gate', iconColor: 'text-amber-400' };
    case 'TIGHTENING':
      return { bg: 'bg-sky-500/20 border-sky-500/40 text-sky-300', text: 'text-sky-300', label: 'VCP Tightening (Cheat)', iconColor: 'text-sky-400' };
    case 'FORMING':
      return { bg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300', text: 'text-indigo-300', label: 'Base Forming', iconColor: 'text-indigo-400' };
    case 'EXTENDED':
      return { bg: 'bg-purple-500/20 border-purple-500/40 text-purple-300', text: 'text-purple-300', label: 'Extended (>5%)', iconColor: 'text-purple-400' };
    default:
      return { bg: 'bg-zinc-800 text-zinc-400 border-zinc-700', text: 'text-zinc-400', label: stage, iconColor: 'text-zinc-400' };
  }
}

export function generateBreakoutEmailBody(stock: StockData, benchmark: BenchmarkIndex): { subject: string; body: string } {
  const isNifty = benchmark === 'NIFTY_50';
  const benchName = isNifty ? 'NIFTY 50' : 'S&P 500';
  const alpha = isNifty ? stock.rsPerformanceVsNifty.alpha3M : stock.rsPerformanceVsSP500.alpha3M;
  const rsiSpread = isNifty ? stock.rsiToNiftySpread : stock.rsiToSP500Spread;
  const curr = stock.currency === 'INR' ? '₹' : '$';

  const subject = `[MINERVINI BREAKOUT ALERT] ${stock.symbol} (${stock.name}) - ADX: ${stock.adx14.toFixed(1)} & Vol: ${stock.volumeSurgeRatio.toFixed(1)}x`;

  const body = `MARK MINERVINI TREND TRADING SCANNER BREAKOUT ALERT
======================================================
Ticker: ${stock.symbol} (${stock.exchange}: ${stock.name})
Sector: ${stock.sector} | Industry: ${stock.industry}
Current Price: ${curr}${stock.currentPrice.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
VCP Stage: ${stock.vcpStage.replace('_', ' ')}

1. MINERVINI TREND TEMPLATE (SCORE: ${stock.checklist.score}/8)
------------------------------------------------------
• Price > 150 & 200 SMA: ${stock.checklist.priceAbove150and200SMA ? 'PASS' : 'FAIL'}
• 150 SMA > 200 SMA: ${stock.checklist.sma150Above200 ? 'PASS' : 'FAIL'}
• 200 SMA Trending Up (${stock.sma200TrendingUpDays} days): ${stock.checklist.sma200TrendingUp ? 'PASS' : 'FAIL'}
• 50 SMA > 150 & 200 SMA: ${stock.checklist.sma50Above150and200 ? 'PASS' : 'FAIL'}
• Price > 50 SMA: ${stock.checklist.priceAbove50SMA ? 'PASS' : 'FAIL'}
• Distance from 52W Low: +${stock.pctAbove52WLow.toFixed(1)}% (Min 30%)
• Distance from 52W High: ${stock.pctFrom52WHigh.toFixed(1)}% (Within 25%)
• RS Rating: ${stock.rsRating}th Percentile (Min 70)

2. AVERAGE DIRECTIONAL INDEX (ADX) & TREND CONFIRMATION
------------------------------------------------------
• ADX (14-period): ${stock.adx14.toFixed(1)} ${stock.adx14 >= 25 ? '✅ (PASS: Exceeds 25 Strong Trend Threshold)' : '⚠️ (Under 25 Threshold)'}
• +DI (Bullish Directional): ${stock.plusDI.toFixed(1)}
• -DI (Bearish Directional): ${stock.minusDI.toFixed(1)}
• Directional Bias: ${stock.plusDI > stock.minusDI ? 'BULLISH (+DI > -DI)' : 'BEARISH (-DI > +DI)'}
• Trend Category: ${stock.adxTrendStrength.replace('_', ' ')}

3. VOLUME ANALYSIS & BREAKOUT EXPANSION
------------------------------------------------------
• Today's Volume: ${formatCompactNumber(stock.volume)}
• 50-Day Average Volume: ${formatCompactNumber(stock.avgVolume50D)}
• Volume Surge Ratio: ${stock.volumeSurgeRatio.toFixed(2)}x (50-Day SMA)
• Volume vs 50D SMA: ${stock.volumeAbove50SMA ? '✅ EXPANDING (> 50-Day Average)' : '⚠️ Below Average'}
• Breakout Volume Status: ${stock.isVolumeBreakout ? '🔥 INSTITUTIONAL ACCUMULATION SPIKE (>1.5x)' : 'Moderate Volume'}
• Recent Base Volume Behavior: Supply dry-up in handle followed by volume expansion on pivot approach

4. VOLATILITY CONTRACTION PARAMETERS (VCP)
------------------------------------------------------
• Number of Contractions: ${stock.totalContractions}T
${stock.contractions.map(c => `  - Contraction ${c.contractionNumber}: ${c.depthPercent}% over ${c.durationDays} days (Vol drop: ${c.volumeReductionPercent}%)`).join('\n')}
• ATR(14): ${stock.atr14.toFixed(2)} (${stock.atrPercent.toFixed(2)}% of price - ${stock.atrTrend})
• Pivot Buy Price: ${curr}${stock.pivotPrice.toFixed(2)}
• Distance to Pivot: ${stock.pctToPivot >= 0 ? '+' : ''}${stock.pctToPivot.toFixed(2)}%

5. RELATIVE STRENGTH VS ${benchName.toUpperCase()} & RSI METRICS
------------------------------------------------------
• RS Rating: ${stock.rsRating} / 99
• RS Line New High Ahead of Price: ${stock.rsNewHighAheadOfPrice ? 'YES (High Institutional Accumulation)' : 'Tracking'}
• 3-Month Alpha vs ${benchName}: +${alpha.toFixed(1)}%
• 1-Year Stock Gain: +${(isNifty ? stock.rsPerformanceVsNifty.perf1Y : stock.rsPerformanceVsSP500.perf1Y).toFixed(1)}%
• RSI (14-period): ${stock.rsi14.toFixed(1)} (${stock.rsiZone})
• RSI Spread vs ${benchName}: ${rsiSpread >= 0 ? '+' : ''}${rsiSpread.toFixed(1)} points

6. RISK MANAGEMENT & EXECUTION PARAMETERS
------------------------------------------------------
• Recommended Stop Loss: ${curr}${stock.recommendedStopLoss.toFixed(2)} (-${stock.riskPercent.toFixed(1)}% max risk)
• Target 1 (2:1 R/R): ${curr}${stock.targetPrice2R.toFixed(2)}
• Target 2 (3:1 R/R): ${curr}${stock.targetPrice3R.toFixed(2)}
• Golden Rule: Never let a gain turn into a loss. Cut losses ruthlessly at stop.

Generated via Minervini Trend Trading Scanner
`;

  return { subject, body };
}

/**
 * Calculates a composite Minervini Smart Alpha Rank (0-100)
 * Weighted multi-factor model:
 * - Trend Template Score (8/8 points): 25%
 * - Relative Strength Rating (0-99 percentile): 25%
 * - Proximity to Pivot Point (-1% to +3% optimal buy sweet spot): 20%
 * - Volume Surge & Institutional Footprint: 15%
 * - ADX Trend Confirmation (>25): 10%
 * - Volatility Compression (low ATR%): 5%
 */
export function calculateSmartRankScore(stock: StockData): number {
  // 1. Trend Score (0 to 25 pts)
  const trendScore = (stock.checklist.score / 8) * 25;

  // 2. RS Rating (0 to 25 pts)
  const rsScore = (Math.min(99, Math.max(0, stock.rsRating)) / 99) * 25;

  // 3. Pivot Proximity (0 to 20 pts)
  // Optimal sweet spot is between -1% and +2.5% of pivot. If extended > 5%, penalized.
  let pivotScore = 0;
  if (stock.pctToPivot >= -1.0 && stock.pctToPivot <= 2.5) {
    pivotScore = 20;
  } else if (stock.pctToPivot > 2.5 && stock.pctToPivot <= 5.0) {
    pivotScore = 15;
  } else if (stock.pctToPivot >= -3.0 && stock.pctToPivot < -1.0) {
    pivotScore = 14;
  } else if (stock.pctToPivot > 5.0) {
    pivotScore = 5; // extended
  } else {
    pivotScore = 8; // deeper in base
  }

  // 4. Volume Surge (0 to 15 pts)
  let volScore = 0;
  if (stock.volumeSurgeRatio >= 2.5) volScore = 15;
  else if (stock.volumeSurgeRatio >= 2.0) volScore = 13;
  else if (stock.volumeSurgeRatio >= 1.5) volScore = 11;
  else if (stock.volumeAbove50SMA) volScore = 8;
  else if (stock.vcpStage === 'TIGHTENING' && stock.volumeSurgeRatio < 0.7) volScore = 10; // good supply dry up
  else volScore = 4;

  // 5. ADX Trend Strength (0 to 10 pts)
  let adxScore = 0;
  if (stock.adx14 >= 35) adxScore = 10;
  else if (stock.adx14 >= 25) adxScore = 8;
  else if (stock.adx14 >= 20) adxScore = 5;
  else adxScore = 2;

  // 6. ATR Volatility Compression (0 to 5 pts)
  let atrScore = 0;
  if (stock.atrPercent <= 2.5) atrScore = 5;
  else if (stock.atrPercent <= 3.5) atrScore = 3.5;
  else atrScore = 2;

  const total = trendScore + rsScore + pivotScore + volScore + adxScore + atrScore;
  return Number(Math.min(99.9, Math.max(10, total)).toFixed(1));
}

/**
 * Detects Minervini Volume Anomalies:
 * 1. Accumulation Spike: Today volume >= 2.0x 50-day average
 * 2. Volume Dry-Up: Volume <= 0.65x average right at the pivot gate (lack of sellers before explosion)
 */
export function detectVolumeAnomaly(stock: StockData): StockData['volumeAnomaly'] {
  if (stock.volumeSurgeRatio >= 2.0) {
    return {
      type: 'ACCUMULATION_SPIKE',
      ratio: stock.volumeSurgeRatio,
      label: `Heavy Accumulation (${stock.volumeSurgeRatio.toFixed(1)}x Vol)`,
      description: `Today's volume is ${stock.volumeSurgeRatio.toFixed(2)}x its 50-day SMA, signaling massive institutional block accumulation.`
    };
  }
  
  if (stock.volumeSurgeRatio <= 0.65 && (stock.vcpStage === 'TIGHTENING' || stock.vcpStage === 'PIVOT_ALERT')) {
    const reductionPct = Math.round((1 - stock.volumeSurgeRatio) * 100);
    return {
      type: 'VOLUME_DRYUP',
      ratio: stock.volumeSurgeRatio,
      label: `Supply Dry-Up (-${reductionPct}%)`,
      description: `Volume dried up by ${reductionPct}% at the pivot gate, demonstrating that overhead institutional supply is exhausted.`
    };
  }

  return null;
}

/**
 * Calculates aggregated sector performance and rotation rankings
 */
export function calculateSectorPerformance(stocks: StockData[], benchmark: BenchmarkIndex): SectorPerformance[] {
  const isNifty = benchmark === 'NIFTY_50';
  const sectorMap = new Map<string, StockData[]>();

  stocks.forEach(stock => {
    const list = sectorMap.get(stock.sector) || [];
    list.push(stock);
    sectorMap.set(stock.sector, list);
  });

  const results: SectorPerformance[] = [];

  sectorMap.forEach((sectorStocks, sector) => {
    const stockCount = sectorStocks.length;
    const breakoutCount = sectorStocks.filter(
      s => s.vcpStage === 'CONFIRMED_BREAKOUT' || s.vcpStage === 'PIVOT_ALERT'
    ).length;

    const avgRSRating = Number(
      (sectorStocks.reduce((sum, s) => sum + s.rsRating, 0) / stockCount).toFixed(1)
    );
    const avgChangePercent = Number(
      (sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) / stockCount).toFixed(2)
    );
    const avgRsi = Number(
      (sectorStocks.reduce((sum, s) => sum + s.rsi14, 0) / stockCount).toFixed(1)
    );
    const avgAlpha3M = Number(
      (sectorStocks.reduce((sum, s) => {
        const alpha = isNifty ? s.rsPerformanceVsNifty.alpha3M : s.rsPerformanceVsSP500.alpha3M;
        return sum + alpha;
      }, 0) / stockCount).toFixed(1)
    );

    // Find top stock by gain or RS
    const sorted = [...sectorStocks].sort((a, b) => b.rsRating - a.rsRating);
    const topStock = sorted[0];

    // Momentum Rank classification
    let momentumRank: SectorPerformance['momentumRank'] = 'NEUTRAL';
    if (avgRSRating >= 85 && avgAlpha3M >= 15) {
      momentumRank = 'LEADING';
    } else if (avgRSRating >= 75 || avgAlpha3M >= 8) {
      momentumRank = 'IMPROVING';
    } else if (avgRSRating < 65 || avgAlpha3M < 0) {
      momentumRank = 'LAGGING';
    }

    results.push({
      sector,
      stockCount,
      breakoutCount,
      avgRSRating,
      avgChangePercent,
      avgAlpha3M,
      avgRsi,
      topStockSymbol: topStock ? topStock.symbol : '',
      topStockGain: topStock ? topStock.changePercent : 0,
      momentumRank
    });
  });

  return results.sort((a, b) => b.avgRSRating - a.avgRSRating);
}
