import { StockData, BenchmarkMetrics, PricePoint, BenchmarkDataPoint } from '../types';
import { calculateSmartRankScore, detectVolumeAnomaly } from '../utils/technicalCalculations';

// Generate 120 days of benchmark history
function generateBenchmarkHistory(basePrice: number, baseRsi: number, trend: number): BenchmarkDataPoint[] {
  const points: BenchmarkDataPoint[] = [];
  let price = basePrice * 0.82;
  const now = new Date();
  
  for (let i = 120; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
    
    const noise = (Math.sin(i * 0.3) * 0.008) + ((Math.random() - 0.48) * 0.012) + (trend / 120);
    price = price * (1 + noise);
    
    // RSI calculation approximation for series
    const rsi = Math.max(35, Math.min(80, baseRsi + Math.sin(i * 0.2) * 8 + (Math.random() - 0.5) * 4));
    
    points.push({
      date: d.toISOString().split('T')[0],
      close: Number(price.toFixed(2)),
      rsi: Number(rsi.toFixed(1))
    });
  }
  return points;
}

export const NIFTY_50_BENCHMARK: BenchmarkMetrics = {
  name: 'NIFTY 50 Index',
  symbol: '^NSEI',
  currentPrice: 25388.90,
  changePercent: 0.48,
  rsi14: 58.6,
  perf1M: 2.3,
  perf3M: 6.1,
  perf6M: 12.8,
  perf1Y: 24.5,
  history: generateBenchmarkHistory(25388.90, 58.6, 0.22)
};

export const SP500_BENCHMARK: BenchmarkMetrics = {
  name: 'S&P 500 Index',
  symbol: '^GSPC',
  currentPrice: 5626.02,
  changePercent: 0.35,
  rsi14: 61.2,
  perf1M: 1.9,
  perf3M: 6.4,
  perf6M: 14.5,
  perf1Y: 26.2,
  history: generateBenchmarkHistory(5626.02, 61.2, 0.24)
};

// Helper to generate realistic OHLCV price series for a stock
function generateStockCandles(
  currentPrice: number,
  baseDepthPct: number,
  vcpStage: string,
  pivotPrice: number,
  baseVolume: number,
  volumeSurge: number
): PricePoint[] {
  const candles: PricePoint[] = [];
  const totalDays = 90;
  const now = new Date();
  
  // Create realistic path: first deep contraction, second tighter contraction, third tightest near pivot
  let price = currentPrice * (1 - baseDepthPct / 100);
  const prices: number[] = [];

  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Simulate VCP waves
    const progress = (totalDays - i) / totalDays;
    let wave = 0;
    if (progress < 0.4) {
      // Wave 1: First contraction and recovery
      wave = Math.sin(progress * Math.PI * 2.5) * (baseDepthPct * 0.45);
    } else if (progress < 0.75) {
      // Wave 2: Second tighter contraction
      wave = Math.sin((progress - 0.4) * Math.PI * 3.5) * (baseDepthPct * 0.22);
    } else {
      // Wave 3: Tightest handle / cheat area
      wave = Math.sin((progress - 0.75) * Math.PI * 5) * (baseDepthPct * 0.08);
      if (vcpStage === 'CONFIRMED_BREAKOUT' && i < 3) {
        wave += 4; // breakout surge
      }
    }

    const drift = progress * (currentPrice - (currentPrice * (1 - baseDepthPct / 100)));
    const dailyPrice = currentPrice * (1 - baseDepthPct / 100) + drift + wave + (Math.random() - 0.48) * (currentPrice * 0.008);
    
    prices.push(Math.max(dailyPrice, currentPrice * 0.6));
    
    // Volatility and volume dynamics
    // In VCP, volume contracts as volatility contracts
    const isLateCycle = progress > 0.65;
    const isBreakout = (vcpStage === 'CONFIRMED_BREAKOUT' || vcpStage === 'PIVOT_ALERT') && i < 2;
    
    let vol = baseVolume;
    if (isBreakout) {
      vol = baseVolume * volumeSurge;
    } else if (isLateCycle) {
      vol = baseVolume * (0.45 + Math.random() * 0.35); // Dry-up volume
    } else {
      vol = baseVolume * (0.8 + Math.random() * 0.6);
    }

    const dayHigh = dailyPrice * (1 + Math.random() * 0.012 + (isBreakout ? 0.02 : 0.005));
    const dayLow = dailyPrice * (1 - Math.random() * 0.012 - 0.003);
    const dayOpen = dayLow + Math.random() * (dayHigh - dayLow);
    const dayClose = dailyPrice;

    candles.push({
      date: d.toISOString().split('T')[0],
      open: Number(dayOpen.toFixed(2)),
      high: Number(dayHigh.toFixed(2)),
      low: Number(dayLow.toFixed(2)),
      close: Number(dayClose.toFixed(2)),
      volume: Math.round(vol)
    });
  }

  // Calculate moving averages and RSI
  for (let i = 0; i < candles.length; i++) {
    // 20 EMA / SMA
    if (i >= 19) {
      const slice20 = candles.slice(i - 19, i + 1);
      candles[i].sma20 = Number((slice20.reduce((acc, c) => acc + c.close, 0) / 20).toFixed(2));
    }
    // 50 SMA
    if (i >= 49) {
      const slice50 = candles.slice(i - 49, i + 1);
      candles[i].sma50 = Number((slice50.reduce((acc, c) => acc + c.close, 0) / 50).toFixed(2));
    } else {
      candles[i].sma50 = Number((candles[i].close * 0.94).toFixed(2));
    }
    // 150 & 200 SMA approximations for display
    candles[i].sma150 = Number((candles[i].close * 0.88).toFixed(2));
    candles[i].sma200 = Number((candles[i].close * 0.82).toFixed(2));

    // RSI calculation (14 period)
    if (i >= 14) {
      let gains = 0;
      let losses = 0;
      for (let j = i - 13; j <= i; j++) {
        const diff = candles[j].close - candles[j - 1].close;
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14 || 0.0001;
      const rs = avgGain / avgLoss;
      candles[i].rsi = Number((100 - (100 / (1 + rs))).toFixed(1));
    } else {
      candles[i].rsi = 62.0;
    }

    // RS Line vs benchmark ratio scaled
    candles[i].rsLine = Number((candles[i].close / (currentPrice * 0.9) * 100).toFixed(2));

    // ADX calculation (14-period Wilder's Directional Movement)
    if (i >= 14) {
      let trSum = 0;
      let plusDMSum = 0;
      let minusDMSum = 0;
      for (let j = i - 13; j <= i; j++) {
        const prevClose = candles[j - 1] ? candles[j - 1].close : candles[j].open;
        const tr = Math.max(
          candles[j].high - candles[j].low,
          Math.abs(candles[j].high - prevClose),
          Math.abs(candles[j].low - prevClose)
        );
        const upMove = candles[j].high - (candles[j - 1] ? candles[j - 1].high : candles[j].high);
        const downMove = (candles[j - 1] ? candles[j - 1].low : candles[j].low) - candles[j].low;
        const plusDM = (upMove > downMove && upMove > 0) ? upMove : 0;
        const minusDM = (downMove > upMove && downMove > 0) ? downMove : 0;
        trSum += tr;
        plusDMSum += plusDM;
        minusDMSum += minusDM;
      }
      const safeTR = trSum || 1;
      const pDI = (plusDMSum / safeTR) * 100;
      const mDI = (minusDMSum / safeTR) * 100;
      const diSum = pDI + mDI || 1;
      const dx = (Math.abs(pDI - mDI) / diSum) * 100;
      
      candles[i].plusDI = Number(pDI.toFixed(1));
      candles[i].minusDI = Number(mDI.toFixed(1));
      // Trend strength builds as price contracts and breaks out
      const stageBonus = vcpStage === 'CONFIRMED_BREAKOUT' ? 6 : vcpStage === 'PIVOT_ALERT' ? 3 : 0;
      candles[i].adx = Number((Math.min(58, Math.max(16, dx * 0.75 + 14 + stageBonus))).toFixed(1));
    } else {
      candles[i].plusDI = 27.5;
      candles[i].minusDI = 13.8;
      candles[i].adx = 24.2;
    }
  }

  return candles;
}

const RAW_INITIAL_STOCKS: Omit<StockData, 'adx14' | 'plusDI' | 'minusDI' | 'adxTrendStrength' | 'volumeAbove50SMA' | 'isVolumeBreakout' | 'recentVolumeTrend'>[] = [
  // ================= NIFTY / NSE MOMENTUM BREAKOUTS =================
  {
    symbol: 'TRENT',
    name: 'Trent Ltd (Tata Group)',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Consumer Discretionary',
    industry: 'Retail - Apparel & Department',
    currentPrice: 7280.00,
    changePercent: 3.45,
    volume: 1845000,
    avgVolume50D: 820000,
    volumeSurgeRatio: 2.25,
    high52W: 7350.00,
    low52W: 2040.00,
    pctFrom52WHigh: -0.95,
    pctAbove52WLow: 256.8,
    sma20: 7040.0,
    sma50: 6710.0,
    sma150: 5540.0,
    sma200: 4890.0,
    sma200TrendingUpDays: 145,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'CONFIRMED_BREAKOUT',
    contractions: [
      { contractionNumber: 1, depthPercent: -18.4, durationDays: 24, volumeReductionPercent: -35 },
      { contractionNumber: 2, depthPercent: -8.6, durationDays: 12, volumeReductionPercent: -52 },
      { contractionNumber: 3, depthPercent: -3.2, durationDays: 5, volumeReductionPercent: -68 }
    ],
    totalContractions: 3,
    pivotPrice: 7120.00,
    pctToPivot: 2.25, // Just broke out in buy range
    atr14: 142.0,
    atrPercent: 1.95, // Tight ATR compression!
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 7,
    baseDepthPercent: 18.4,
    rsRating: 99,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 14.8,
      perf3M: 38.2,
      perf6M: 82.5,
      perf1Y: 215.4,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 32.1
    },
    rsPerformanceVsSP500: {
      perf1M: 14.8,
      perf3M: 38.2,
      perf6M: 82.5,
      perf1Y: 215.4,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 31.8
    },
    rsi14: 73.8,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 15.2, // Stock 73.8 - Nifty 58.6
    rsiToSP500Spread: 12.6,
    recommendedStopLoss: 6870.00,
    riskPercent: 5.6,
    targetPrice2R: 7950.00,
    targetPrice3R: 8350.00,
    historicalData: generateStockCandles(7280.00, 18.4, 'CONFIRMED_BREAKOUT', 7120.00, 820000, 2.25)
  },
  {
    symbol: 'DIXON',
    name: 'Dixon Technologies Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Technology Hardware',
    industry: 'Electronic Manufacturing Services',
    currentPrice: 12850.00,
    changePercent: 2.15,
    volume: 640000,
    avgVolume50D: 310000,
    volumeSurgeRatio: 2.06,
    high52W: 13100.00,
    low52W: 4900.00,
    pctFrom52WHigh: -1.9,
    pctAbove52WLow: 162.2,
    sma20: 12420.0,
    sma50: 11950.0,
    sma150: 9840.0,
    sma200: 8750.0,
    sma200TrendingUpDays: 160,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'PIVOT_ALERT',
    contractions: [
      { contractionNumber: 1, depthPercent: -22.1, durationDays: 32, volumeReductionPercent: -30 },
      { contractionNumber: 2, depthPercent: -11.5, durationDays: 16, volumeReductionPercent: -48 },
      { contractionNumber: 3, depthPercent: -5.4, durationDays: 8, volumeReductionPercent: -65 },
      { contractionNumber: 4, depthPercent: -2.1, durationDays: 3, volumeReductionPercent: -75 }
    ],
    totalContractions: 4,
    pivotPrice: 12980.00,
    pctToPivot: -1.0, // Right at the pivot gate!
    atr14: 245.0,
    atrPercent: 1.91,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 9,
    baseDepthPercent: 22.1,
    rsRating: 98,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 11.2,
      perf3M: 32.4,
      perf6M: 74.2,
      perf1Y: 148.9,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 26.3
    },
    rsPerformanceVsSP500: {
      perf1M: 11.2,
      perf3M: 32.4,
      perf6M: 74.2,
      perf1Y: 148.9,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 26.0
    },
    rsi14: 68.4,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 9.8,
    rsiToSP500Spread: 7.2,
    recommendedStopLoss: 12380.00,
    riskPercent: 4.6,
    targetPrice2R: 14170.00,
    targetPrice3R: 14780.00,
    historicalData: generateStockCandles(12850.00, 22.1, 'PIVOT_ALERT', 12980.00, 310000, 2.06)
  },
  {
    symbol: 'BEL',
    name: 'Bharat Electronics Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Capital Goods & Aerospace',
    industry: 'Defense Electronics',
    currentPrice: 312.40,
    changePercent: 1.85,
    volume: 24500000,
    avgVolume50D: 14200000,
    volumeSurgeRatio: 1.72,
    high52W: 340.00,
    low52W: 127.00,
    pctFrom52WHigh: -8.1,
    pctAbove52WLow: 146.0,
    sma20: 304.5,
    sma50: 298.0,
    sma150: 264.0,
    sma200: 232.0,
    sma200TrendingUpDays: 130,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'TIGHTENING',
    contractions: [
      { contractionNumber: 1, depthPercent: -16.2, durationDays: 20, volumeReductionPercent: -28 },
      { contractionNumber: 2, depthPercent: -7.8, durationDays: 9, volumeReductionPercent: -45 },
      { contractionNumber: 3, depthPercent: -3.5, durationDays: 4, volumeReductionPercent: -62 }
    ],
    totalContractions: 3,
    pivotPrice: 322.00,
    pctToPivot: -2.98,
    atr14: 6.8,
    atrPercent: 2.18,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 6,
    baseDepthPercent: 16.2,
    rsRating: 95,
    rsNewHighAheadOfPrice: false,
    rsPerformanceVsNifty: {
      perf1M: 6.8,
      perf3M: 19.5,
      perf6M: 52.1,
      perf1Y: 132.8,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 13.4
    },
    rsPerformanceVsSP500: {
      perf1M: 6.8,
      perf3M: 19.5,
      perf6M: 52.1,
      perf1Y: 132.8,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 13.1
    },
    rsi14: 64.2,
    rsiZone: 'HEALTHY_BULLISH',
    rsiToNiftySpread: 5.6,
    rsiToSP500Spread: 3.0,
    recommendedStopLoss: 298.50,
    riskPercent: 4.4,
    targetPrice2R: 350.00,
    targetPrice3R: 368.00,
    historicalData: generateStockCandles(312.40, 16.2, 'TIGHTENING', 322.00, 14200000, 1.72)
  },
  {
    symbol: 'HAL',
    name: 'Hindustan Aeronautics Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Defense & Aerospace',
    industry: 'Aircraft & Defense Systems',
    currentPrice: 4720.00,
    changePercent: 1.45,
    volume: 1520000,
    avgVolume50D: 1100000,
    volumeSurgeRatio: 1.38,
    high52W: 5675.00,
    low52W: 1850.00,
    pctFrom52WHigh: -16.8,
    pctAbove52WLow: 155.1,
    sma20: 4620.0,
    sma50: 4580.0,
    sma150: 4210.0,
    sma200: 3690.0,
    sma200TrendingUpDays: 150,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'TIGHTENING',
    contractions: [
      { contractionNumber: 1, depthPercent: -24.5, durationDays: 35, volumeReductionPercent: -40 },
      { contractionNumber: 2, depthPercent: -12.1, durationDays: 15, volumeReductionPercent: -58 },
      { contractionNumber: 3, depthPercent: -4.8, durationDays: 6, volumeReductionPercent: -72 }
    ],
    totalContractions: 3,
    pivotPrice: 4890.00,
    pctToPivot: -3.48,
    atr14: 110.0,
    atrPercent: 2.33,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 10,
    baseDepthPercent: 24.5,
    rsRating: 94,
    rsNewHighAheadOfPrice: false,
    rsPerformanceVsNifty: {
      perf1M: 5.2,
      perf3M: 18.2,
      perf6M: 48.9,
      perf1Y: 142.0,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 12.1
    },
    rsPerformanceVsSP500: {
      perf1M: 5.2,
      perf3M: 18.2,
      perf6M: 48.9,
      perf1Y: 142.0,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 11.8
    },
    rsi14: 61.5,
    rsiZone: 'HEALTHY_BULLISH',
    rsiToNiftySpread: 2.9,
    rsiToSP500Spread: 0.3,
    recommendedStopLoss: 4490.00,
    riskPercent: 4.8,
    targetPrice2R: 5350.00,
    targetPrice3R: 5600.00,
    historicalData: generateStockCandles(4720.00, 24.5, 'TIGHTENING', 4890.00, 1100000, 1.38)
  },
  {
    symbol: 'SUZLON',
    name: 'Suzlon Energy Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Renewable Energy',
    industry: 'Wind Turbines & Clean Tech',
    currentPrice: 84.60,
    changePercent: 4.82,
    volume: 98000000,
    avgVolume50D: 42000000,
    volumeSurgeRatio: 2.33,
    high52W: 86.00,
    low52W: 24.50,
    pctFrom52WHigh: -1.6,
    pctAbove52WLow: 245.3,
    sma20: 78.4,
    sma50: 72.5,
    sma150: 56.0,
    sma200: 48.0,
    sma200TrendingUpDays: 180,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'CONFIRMED_BREAKOUT',
    contractions: [
      { contractionNumber: 1, depthPercent: -20.5, durationDays: 22, volumeReductionPercent: -35 },
      { contractionNumber: 2, depthPercent: -9.4, durationDays: 11, volumeReductionPercent: -50 },
      { contractionNumber: 3, depthPercent: -3.8, durationDays: 4, volumeReductionPercent: -68 }
    ],
    totalContractions: 3,
    pivotPrice: 82.50,
    pctToPivot: 2.54,
    atr14: 2.1,
    atrPercent: 2.48,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 6,
    baseDepthPercent: 20.5,
    rsRating: 97,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 18.5,
      perf3M: 46.2,
      perf6M: 92.4,
      perf1Y: 228.0,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 40.1
    },
    rsPerformanceVsSP500: {
      perf1M: 18.5,
      perf3M: 46.2,
      perf6M: 92.4,
      perf1Y: 228.0,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 39.8
    },
    rsi14: 76.2,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 17.6,
    rsiToSP500Spread: 15.0,
    recommendedStopLoss: 78.80,
    riskPercent: 6.8,
    targetPrice2R: 96.00,
    targetPrice3R: 102.00,
    historicalData: generateStockCandles(84.60, 20.5, 'CONFIRMED_BREAKOUT', 82.50, 42000000, 2.33)
  },
  {
    symbol: 'KAYNES',
    name: 'Kaynes Technology India Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Technology Hardware',
    industry: 'IoT & Precision Electronics',
    currentPrice: 5380.00,
    changePercent: 2.80,
    volume: 480000,
    avgVolume50D: 240000,
    volumeSurgeRatio: 2.00,
    high52W: 5540.00,
    low52W: 1980.00,
    pctFrom52WHigh: -2.88,
    pctAbove52WLow: 171.7,
    sma20: 5120.0,
    sma50: 4860.0,
    sma150: 3940.0,
    sma200: 3420.0,
    sma200TrendingUpDays: 140,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'PIVOT_ALERT',
    contractions: [
      { contractionNumber: 1, depthPercent: -21.4, durationDays: 28, volumeReductionPercent: -32 },
      { contractionNumber: 2, depthPercent: -10.2, durationDays: 14, volumeReductionPercent: -54 },
      { contractionNumber: 3, depthPercent: -4.1, durationDays: 5, volumeReductionPercent: -71 }
    ],
    totalContractions: 3,
    pivotPrice: 5420.00,
    pctToPivot: -0.74,
    atr14: 112.0,
    atrPercent: 2.08,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 8,
    baseDepthPercent: 21.4,
    rsRating: 96,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 12.4,
      perf3M: 35.8,
      perf6M: 78.6,
      perf1Y: 165.2,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 29.7
    },
    rsPerformanceVsSP500: {
      perf1M: 12.4,
      perf3M: 35.8,
      perf6M: 78.6,
      perf1Y: 165.2,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 29.4
    },
    rsi14: 69.5,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 10.9,
    rsiToSP500Spread: 8.3,
    recommendedStopLoss: 5120.00,
    riskPercent: 4.8,
    targetPrice2R: 5900.00,
    targetPrice3R: 6200.00,
    historicalData: generateStockCandles(5380.00, 21.4, 'PIVOT_ALERT', 5420.00, 240000, 2.00)
  },
  {
    symbol: 'ZOMATO',
    name: 'Zomato Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Consumer Services',
    industry: 'Food Delivery & Quick Commerce (Blinkit)',
    currentPrice: 284.50,
    changePercent: 1.90,
    volume: 38000000,
    avgVolume50D: 28000000,
    volumeSurgeRatio: 1.36,
    high52W: 298.00,
    low52W: 98.00,
    pctFrom52WHigh: -4.5,
    pctAbove52WLow: 190.3,
    sma20: 274.0,
    sma50: 258.0,
    sma150: 212.0,
    sma200: 184.0,
    sma200TrendingUpDays: 165,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'TIGHTENING',
    contractions: [
      { contractionNumber: 1, depthPercent: -17.5, durationDays: 24, volumeReductionPercent: -30 },
      { contractionNumber: 2, depthPercent: -8.0, durationDays: 10, volumeReductionPercent: -48 },
      { contractionNumber: 3, depthPercent: -3.1, durationDays: 4, volumeReductionPercent: -65 }
    ],
    totalContractions: 3,
    pivotPrice: 294.00,
    pctToPivot: -3.23,
    atr14: 6.4,
    atrPercent: 2.25,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 7,
    baseDepthPercent: 17.5,
    rsRating: 93,
    rsNewHighAheadOfPrice: false,
    rsPerformanceVsNifty: {
      perf1M: 8.4,
      perf3M: 24.6,
      perf6M: 61.2,
      perf1Y: 174.5,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 18.5
    },
    rsPerformanceVsSP500: {
      perf1M: 8.4,
      perf3M: 24.6,
      perf6M: 61.2,
      perf1Y: 174.5,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 18.2
    },
    rsi14: 66.8,
    rsiZone: 'HEALTHY_BULLISH',
    rsiToNiftySpread: 8.2,
    rsiToSP500Spread: 5.6,
    recommendedStopLoss: 272.00,
    riskPercent: 4.4,
    targetPrice2R: 320.00,
    targetPrice3R: 335.00,
    historicalData: generateStockCandles(284.50, 17.5, 'TIGHTENING', 294.00, 28000000, 1.36)
  },
  {
    symbol: 'SOLARINDS',
    name: 'Solar Industries India Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Materials & Defense',
    industry: 'Industrial Explosives & Defense Warheads',
    currentPrice: 11450.00,
    changePercent: 2.90,
    volume: 185000,
    avgVolume50D: 95000,
    volumeSurgeRatio: 1.95,
    high52W: 11780.00,
    low52W: 4650.00,
    pctFrom52WHigh: -2.8,
    pctAbove52WLow: 146.2,
    sma20: 10980.0,
    sma50: 10450.0,
    sma150: 8900.0,
    sma200: 7850.0,
    sma200TrendingUpDays: 155,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'PIVOT_ALERT',
    contractions: [
      { contractionNumber: 1, depthPercent: -19.0, durationDays: 26, volumeReductionPercent: -35 },
      { contractionNumber: 2, depthPercent: -9.2, durationDays: 13, volumeReductionPercent: -52 },
      { contractionNumber: 3, depthPercent: -3.8, durationDays: 5, volumeReductionPercent: -70 }
    ],
    totalContractions: 3,
    pivotPrice: 11580.00,
    pctToPivot: -1.12,
    atr14: 215.0,
    atrPercent: 1.88,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 8,
    baseDepthPercent: 19.0,
    rsRating: 95,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 9.8,
      perf3M: 28.5,
      perf6M: 68.2,
      perf1Y: 138.4,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 22.4
    },
    rsPerformanceVsSP500: {
      perf1M: 9.8,
      perf3M: 28.5,
      perf6M: 68.2,
      perf1Y: 138.4,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 22.1
    },
    rsi14: 70.2,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 11.6,
    rsiToSP500Spread: 9.0,
    recommendedStopLoss: 10920.00,
    riskPercent: 4.6,
    targetPrice2R: 12500.00,
    targetPrice3R: 13100.00,
    historicalData: generateStockCandles(11450.00, 19.0, 'PIVOT_ALERT', 11580.00, 95000, 1.95)
  },
  {
    symbol: 'POLYCAB',
    name: 'Polycab India Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Industrials',
    industry: 'Cables & Electrical Infrastructure',
    currentPrice: 6780.00,
    changePercent: 1.25,
    volume: 820000,
    avgVolume50D: 680000,
    volumeSurgeRatio: 1.21,
    high52W: 7350.00,
    low52W: 4680.00,
    pctFrom52WHigh: -7.75,
    pctAbove52WLow: 44.8,
    sma20: 6640.0,
    sma50: 6520.0,
    sma150: 6150.0,
    sma200: 5720.0,
    sma200TrendingUpDays: 110,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'FORMING',
    contractions: [
      { contractionNumber: 1, depthPercent: -15.8, durationDays: 20, volumeReductionPercent: -25 },
      { contractionNumber: 2, depthPercent: -8.1, durationDays: 10, volumeReductionPercent: -42 }
    ],
    totalContractions: 2,
    pivotPrice: 7080.00,
    pctToPivot: -4.24,
    atr14: 138.0,
    atrPercent: 2.04,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 5,
    baseDepthPercent: 15.8,
    rsRating: 88,
    rsNewHighAheadOfPrice: false,
    rsPerformanceVsNifty: {
      perf1M: 4.8,
      perf3M: 14.2,
      perf6M: 38.5,
      perf1Y: 52.4,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 8.1
    },
    rsPerformanceVsSP500: {
      perf1M: 4.8,
      perf3M: 14.2,
      perf6M: 38.5,
      perf1Y: 52.4,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 7.8
    },
    rsi14: 59.8,
    rsiZone: 'HEALTHY_BULLISH',
    rsiToNiftySpread: 1.2,
    rsiToSP500Spread: -1.4,
    recommendedStopLoss: 6480.00,
    riskPercent: 4.4,
    targetPrice2R: 7450.00,
    targetPrice3R: 7750.00,
    historicalData: generateStockCandles(6780.00, 15.8, 'FORMING', 7080.00, 680000, 1.21)
  },
  {
    symbol: 'PERSISTENT',
    name: 'Persistent Systems Ltd',
    market: 'NIFTY',
    currency: 'INR',
    exchange: 'NSE',
    sector: 'Information Technology',
    industry: 'Software Services & Enterprise AI',
    currentPrice: 5490.00,
    changePercent: 3.10,
    volume: 720000,
    avgVolume50D: 380000,
    volumeSurgeRatio: 1.89,
    high52W: 5580.00,
    low52W: 2820.00,
    pctFrom52WHigh: -1.6,
    pctAbove52WLow: 94.7,
    sma20: 5280.0,
    sma50: 5040.0,
    sma150: 4420.0,
    sma200: 4010.0,
    sma200TrendingUpDays: 135,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'CONFIRMED_BREAKOUT',
    contractions: [
      { contractionNumber: 1, depthPercent: -17.2, durationDays: 22, volumeReductionPercent: -32 },
      { contractionNumber: 2, depthPercent: -8.5, durationDays: 11, volumeReductionPercent: -54 },
      { contractionNumber: 3, depthPercent: -3.4, durationDays: 5, volumeReductionPercent: -66 }
    ],
    totalContractions: 3,
    pivotPrice: 5380.00,
    pctToPivot: 2.04,
    atr14: 104.0,
    atrPercent: 1.89,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 7,
    baseDepthPercent: 17.2,
    rsRating: 94,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 10.5,
      perf3M: 26.8,
      perf6M: 58.4,
      perf1Y: 96.2,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 20.7
    },
    rsPerformanceVsSP500: {
      perf1M: 10.5,
      perf3M: 26.8,
      perf6M: 58.4,
      perf1Y: 96.2,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 20.4
    },
    rsi14: 72.1,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 13.5,
    rsiToSP500Spread: 10.9,
    recommendedStopLoss: 5220.00,
    riskPercent: 4.9,
    targetPrice2R: 6020.00,
    targetPrice3R: 6300.00,
    historicalData: generateStockCandles(5490.00, 17.2, 'CONFIRMED_BREAKOUT', 5380.00, 380000, 1.89)
  },

  // ================= US GROWTH MOMENTUM BREAKOUTS =================
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc',
    market: 'US',
    currency: 'USD',
    exchange: 'NYSE',
    sector: 'Technology',
    industry: 'Enterprise AI & Defense Analytics',
    currentPrice: 37.80,
    changePercent: 3.85,
    volume: 82000000,
    avgVolume50D: 41000000,
    volumeSurgeRatio: 2.00,
    high52W: 38.20,
    low52W: 14.48,
    pctFrom52WHigh: -1.05,
    pctAbove52WLow: 161.0,
    sma20: 34.60,
    sma50: 31.80,
    sma150: 26.20,
    sma200: 23.50,
    sma200TrendingUpDays: 170,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'CONFIRMED_BREAKOUT',
    contractions: [
      { contractionNumber: 1, depthPercent: -21.0, durationDays: 24, volumeReductionPercent: -34 },
      { contractionNumber: 2, depthPercent: -10.5, durationDays: 12, volumeReductionPercent: -55 },
      { contractionNumber: 3, depthPercent: -4.2, durationDays: 5, volumeReductionPercent: -72 }
    ],
    totalContractions: 3,
    pivotPrice: 36.50,
    pctToPivot: 3.56,
    atr14: 1.15,
    atrPercent: 3.04,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 7,
    baseDepthPercent: 21.0,
    rsRating: 99,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 22.4,
      perf3M: 52.1,
      perf6M: 98.4,
      perf1Y: 152.0,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 46.0
    },
    rsPerformanceVsSP500: {
      perf1M: 22.4,
      perf3M: 52.1,
      perf6M: 98.4,
      perf1Y: 152.0,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 45.7
    },
    rsi14: 77.4,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 18.8,
    rsiToSP500Spread: 16.2,
    recommendedStopLoss: 35.10,
    riskPercent: 7.1,
    targetPrice2R: 43.20,
    targetPrice3R: 46.00,
    historicalData: generateStockCandles(37.80, 21.0, 'CONFIRMED_BREAKOUT', 36.50, 41000000, 2.00)
  },
  {
    symbol: 'APP',
    name: 'AppLovin Corporation',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Communication Services',
    industry: 'AdTech & AI Mobile Marketing',
    currentPrice: 142.50,
    changePercent: 4.20,
    volume: 5800000,
    avgVolume50D: 2600000,
    volumeSurgeRatio: 2.23,
    high52W: 145.00,
    low52W: 36.80,
    pctFrom52WHigh: -1.72,
    pctAbove52WLow: 287.2,
    sma20: 131.20,
    sma50: 118.40,
    sma150: 92.60,
    sma200: 81.50,
    sma200TrendingUpDays: 180,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'CONFIRMED_BREAKOUT',
    contractions: [
      { contractionNumber: 1, depthPercent: -18.2, durationDays: 20, volumeReductionPercent: -38 },
      { contractionNumber: 2, depthPercent: -8.8, durationDays: 10, volumeReductionPercent: -56 },
      { contractionNumber: 3, depthPercent: -3.5, durationDays: 4, volumeReductionPercent: -74 }
    ],
    totalContractions: 3,
    pivotPrice: 138.00,
    pctToPivot: 3.26,
    atr14: 4.60,
    atrPercent: 3.23,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 6,
    baseDepthPercent: 18.2,
    rsRating: 99,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 26.5,
      perf3M: 64.2,
      perf6M: 122.0,
      perf1Y: 280.5,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 58.1
    },
    rsPerformanceVsSP500: {
      perf1M: 26.5,
      perf3M: 64.2,
      perf6M: 122.0,
      perf1Y: 280.5,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 57.8
    },
    rsi14: 78.5,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 19.9,
    rsiToSP500Spread: 17.3,
    recommendedStopLoss: 133.50,
    riskPercent: 6.3,
    targetPrice2R: 160.50,
    targetPrice3R: 170.00,
    historicalData: generateStockCandles(142.50, 18.2, 'CONFIRMED_BREAKOUT', 138.00, 2600000, 2.23)
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Semiconductors & Accelerated Computing',
    currentPrice: 122.80,
    changePercent: 1.65,
    volume: 48000000,
    avgVolume50D: 52000000,
    volumeSurgeRatio: 0.92,
    high52W: 140.76,
    low52W: 40.50,
    pctFrom52WHigh: -12.76,
    pctAbove52WLow: 203.2,
    sma20: 118.40,
    sma50: 121.20,
    sma150: 108.50,
    sma200: 96.80,
    sma200TrendingUpDays: 200,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'TIGHTENING',
    contractions: [
      { contractionNumber: 1, depthPercent: -27.0, durationDays: 38, volumeReductionPercent: -30 },
      { contractionNumber: 2, depthPercent: -13.5, durationDays: 18, volumeReductionPercent: -48 },
      { contractionNumber: 3, depthPercent: -5.8, durationDays: 7, volumeReductionPercent: -65 }
    ],
    totalContractions: 3,
    pivotPrice: 131.00,
    pctToPivot: -6.26,
    atr14: 4.10,
    atrPercent: 3.34,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 12,
    baseDepthPercent: 27.0,
    rsRating: 95,
    rsNewHighAheadOfPrice: false,
    rsPerformanceVsNifty: {
      perf1M: 6.2,
      perf3M: 14.8,
      perf6M: 42.0,
      perf1Y: 168.0,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 8.7
    },
    rsPerformanceVsSP500: {
      perf1M: 6.2,
      perf3M: 14.8,
      perf6M: 42.0,
      perf1Y: 168.0,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 8.4
    },
    rsi14: 57.2,
    rsiZone: 'HEALTHY_BULLISH',
    rsiToNiftySpread: -1.4,
    rsiToSP500Spread: -4.0,
    recommendedStopLoss: 115.20,
    riskPercent: 6.2,
    targetPrice2R: 146.00,
    targetPrice3R: 155.00,
    historicalData: generateStockCandles(122.80, 27.0, 'TIGHTENING', 131.00, 52000000, 0.92)
  },
  {
    symbol: 'AXON',
    name: 'Axon Enterprise Inc',
    market: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Industrials',
    industry: 'Public Safety Tech & Cloud Software',
    currentPrice: 382.40,
    changePercent: 2.65,
    volume: 1240000,
    avgVolume50D: 680000,
    volumeSurgeRatio: 1.82,
    high52W: 390.00,
    low52W: 194.00,
    pctFrom52WHigh: -1.95,
    pctAbove52WLow: 97.1,
    sma20: 368.0,
    sma50: 352.0,
    sma150: 318.0,
    sma200: 295.0,
    sma200TrendingUpDays: 160,
    checklist: {
      priceAbove150and200SMA: true,
      sma150Above200: true,
      sma200TrendingUp: true,
      sma50Above150and200: true,
      priceAbove50SMA: true,
      price30PctAbove52WLow: true,
      priceWithin25Pct52WHigh: true,
      rsRatingAbove70: true,
      score: 8
    },
    vcpStage: 'PIVOT_ALERT',
    contractions: [
      { contractionNumber: 1, depthPercent: -15.4, durationDays: 20, volumeReductionPercent: -32 },
      { contractionNumber: 2, depthPercent: -7.2, durationDays: 10, volumeReductionPercent: -50 },
      { contractionNumber: 3, depthPercent: -2.8, durationDays: 4, volumeReductionPercent: -70 }
    ],
    totalContractions: 3,
    pivotPrice: 386.00,
    pctToPivot: -0.93,
    atr14: 7.80,
    atrPercent: 2.04,
    atrTrend: 'COMPRESSING',
    baseDurationWeeks: 6,
    baseDepthPercent: 15.4,
    rsRating: 96,
    rsNewHighAheadOfPrice: true,
    rsPerformanceVsNifty: {
      perf1M: 9.8,
      perf3M: 27.5,
      perf6M: 56.4,
      perf1Y: 98.2,
      nifty1M: 2.3,
      nifty3M: 6.1,
      nifty6M: 12.8,
      nifty1Y: 24.5,
      alpha3M: 21.4
    },
    rsPerformanceVsSP500: {
      perf1M: 9.8,
      perf3M: 27.5,
      perf6M: 56.4,
      perf1Y: 98.2,
      sp1M: 1.9,
      sp3M: 6.4,
      sp6M: 14.5,
      sp1Y: 26.2,
      alpha3M: 21.1
    },
    rsi14: 69.8,
    rsiZone: 'SUPER_MOMENTUM',
    rsiToNiftySpread: 11.2,
    rsiToSP500Spread: 8.6,
    recommendedStopLoss: 366.00,
    riskPercent: 4.3,
    targetPrice2R: 422.00,
    targetPrice3R: 440.00,
    historicalData: generateStockCandles(382.40, 15.4, 'PIVOT_ALERT', 386.00, 680000, 1.82)
  }
];

export const INITIAL_STOCKS: StockData[] = RAW_INITIAL_STOCKS.map(stock => {
  const lastCandle = stock.historicalData[stock.historicalData.length - 1];
  const adx = lastCandle && lastCandle.adx !== undefined ? lastCandle.adx : 28.5;
  const plusDI = lastCandle && lastCandle.plusDI !== undefined ? lastCandle.plusDI : 31.2;
  const minusDI = lastCandle && lastCandle.minusDI !== undefined ? lastCandle.minusDI : 12.5;
  
  const volumeAbove50SMA = stock.volume > stock.avgVolume50D;
  const isVolumeBreakout = stock.volumeSurgeRatio >= 1.5 && (stock.vcpStage === 'CONFIRMED_BREAKOUT' || stock.vcpStage === 'PIVOT_ALERT');
  
  const adxTrendStrength: StockData['adxTrendStrength'] = 
    adx >= 35 ? 'VERY_STRONG_TREND' : 
    adx >= 25 ? 'STRONG_TREND' : 
    adx >= 20 ? 'MODERATE_TREND' : 'WEAK_TREND';

  const recentVolumeTrend: StockData['recentVolumeTrend'] = 
    stock.volumeSurgeRatio >= 2.0 ? 'HEAVY_ACCUMULATION' :
    stock.volumeSurgeRatio >= 1.4 ? 'ABOVE_AVERAGE' :
    stock.vcpStage === 'TIGHTENING' ? 'DRYING_UP' : 'NORMAL';

  const baseStock: StockData = {
    ...stock,
    adx14: adx,
    plusDI,
    minusDI,
    adxTrendStrength,
    volumeAbove50SMA,
    isVolumeBreakout,
    recentVolumeTrend,
  };

  const volumeAnomaly = detectVolumeAnomaly(baseStock);
  const smartRankScore = calculateSmartRankScore(baseStock);

  return {
    ...baseStock,
    volumeAnomaly,
    smartRankScore,
  };
});

